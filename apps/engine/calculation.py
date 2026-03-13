from collections import defaultdict
from decimal import Decimal

from django.db import transaction


# ---------------------------------------------------------------------------
# Unit normalisation map
# Format: raw_unit → (base_unit, multiplier)
# Converts to the largest sensible base unit to keep quantities readable.
# ---------------------------------------------------------------------------
UNIT_NORMALISATION = {
    'g':      ('kg',     Decimal('0.001')),
    'ml':     ('litre',  Decimal('0.001')),
    'kg':     ('kg',     Decimal('1')),
    'litre':  ('litre',  Decimal('1')),
    'piece':  ('piece',  Decimal('1')),
    'packet': ('packet', Decimal('1')),
    'box':    ('box',    Decimal('1')),
}


def normalise(qty: Decimal, unit: str) -> tuple[Decimal, str]:
    """
    Returns (normalised_qty, base_unit).
    Unknown units are passed through unchanged.
    """
    entry = UNIT_NORMALISATION.get(unit.lower())
    if entry:
        base_unit, factor = entry
        return qty * factor, base_unit
    return qty, unit


class CalculationEngine:
    """
    Reads EventMenuItem.recipe_snapshot for every active menu item,
    expands quantities, normalises units, aggregates by ingredient,
    then atomically replaces all EventIngredient rows for the event.

    Rule: this class is the ONLY writer of EventIngredient.
    """

    @staticmethod
    @transaction.atomic
    def run(event_id) -> int:
        """
        Recalculates all ingredient totals for the given event.
        Returns the number of EventIngredient rows written.
        """
        # Lazy import to avoid circular dependencies at module load time
        from django.apps import apps
        from apps.master.models import Ingredient

        EventMenuItem   = apps.get_model('menu', 'EventMenuItem')
        EventIngredient = apps.get_model('engine', 'EventIngredient')

        # Step 1: fetch all active (non-soft-deleted) menu items for this event
        menu_items = (
            EventMenuItem.objects
            .filter(event_id=event_id, is_deleted=False)
        )

        # Step 2: expand snapshots, normalise units, aggregate by ingredient
        # Key: ingredient_id (str)
        # Value: { total: Decimal, unit: str, name: str }
        # NOTE: if the same ingredient appears in different units that normalise
        # to different base units (e.g. 'piece' vs 'kg'), they are kept separate.
        totals: dict[tuple, dict] = defaultdict(lambda: {
            'total': Decimal('0'),
            'unit':  '',
            'name':  '',
        })

        for item in menu_items:
            dish_qty = item.quantity  # Decimal
            for line in item.recipe_snapshot:
                raw_qty   = Decimal(str(line['qty_per_unit'])) * dish_qty
                norm_qty, base_unit = normalise(raw_qty, line['unit'])

                key = (str(line['ingredient_id']), base_unit)
                totals[key]['total'] += norm_qty
                totals[key]['unit']   = base_unit
                totals[key]['name']   = line['ingredient_name']

        if not totals:
            # No menu items — wipe any stale results and return
            EventIngredient.objects.filter(event_id=event_id).delete()
            return 0

        # Batch-fetch ingredient categories in one query
        ingredient_ids = [iid for iid, _ in totals.keys()]
        category_map: dict[str, str] = {
            str(ing.id): ing.category
            for ing in Ingredient.objects.filter(id__in=ingredient_ids)
        }

        # Step 3: atomically delete old rows + bulk-create fresh results
        EventIngredient.objects.filter(event_id=event_id).delete()

        new_rows = [
            EventIngredient(
                event_id        = event_id,
                ingredient_id   = ingredient_id,
                ingredient_name = data['name'],
                category        = category_map.get(ingredient_id, ''),
                total_quantity  = data['total'],
                unit            = data['unit'],
            )
            for (ingredient_id, _base_unit), data in totals.items()
        ]

        EventIngredient.objects.bulk_create(new_rows)
        return len(new_rows)

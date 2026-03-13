from django.db import models
from shared.mixins import BaseMixin


class EventMenuItem(BaseMixin):

    event = models.ForeignKey(
        'events.Event',
        on_delete=models.CASCADE,
        related_name='menu_items',
    )
    dish = models.ForeignKey(
        'master.Dish',
        on_delete=models.PROTECT,
        related_name='event_appearances',
    )

    # --- Snapshot fields (frozen at first save, never updated after) ---
    dish_name_snapshot  = models.CharField(max_length=255, blank=True)
    unit_type_snapshot  = models.CharField(max_length=10,  blank=True)
    # Format: [{ingredient_id, name, category, qty_per_unit (str), unit}]
    recipe_snapshot     = models.JSONField(default=list, blank=True)

    quantity   = models.DecimalField(max_digits=10, decimal_places=2)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'event_menu_items'
        ordering = ['sort_order', 'created_at']

    def __str__(self):
        return f'{self.event} | {self.dish_name_snapshot or self.dish.name}'

    def save(self, *args, **kwargs):
        # Freeze snapshots on first creation only (blank guards against re-freeze)
        if not self.dish_name_snapshot:
            self.dish_name_snapshot = self.dish.name
        if not self.unit_type_snapshot:
            self.unit_type_snapshot = self.dish.unit_type
        if not self.recipe_snapshot:
            self.recipe_snapshot = self._build_recipe_snapshot()
        super().save(*args, **kwargs)

    def _build_recipe_snapshot(self) -> list:
        return [
            {
                'ingredient_id': str(line.ingredient.id),
                'name':          line.ingredient.name,
                'category':      line.ingredient.category,
                'qty_per_unit':  str(line.qty_per_unit),
                'unit':          line.unit,
            }
            for line in self.dish.recipe_lines.select_related('ingredient').all()
        ]

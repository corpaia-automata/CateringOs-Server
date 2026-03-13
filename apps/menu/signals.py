from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from .models import EventMenuItem


@receiver(post_save, sender=EventMenuItem)
def on_menu_item_saved(sender, instance, **kwargs):
    """Trigger recalculation whenever a menu item is created, updated, or soft-deleted."""
    _run_engine(instance.event_id)


@receiver(post_delete, sender=EventMenuItem)
def on_menu_item_hard_deleted(sender, instance, **kwargs):
    """Trigger recalculation on hard delete (edge case — normally soft delete is used)."""
    _run_engine(instance.event_id)


def _run_engine(event_id):
    # Lazy import avoids circular dependency at module load time:
    # menu.signals → engine.calculation → (lazy) menu.EventMenuItem
    from apps.engine.calculation import CalculationEngine
    CalculationEngine.run(event_id)

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver


@receiver([post_save, post_delete], sender='master.DishRecipe')
def sync_dish_has_recipe(sender, instance, **kwargs):
    """Keep Dish.has_recipe in sync whenever a recipe line is saved or deleted."""
    dish = instance.dish
    has_lines = dish.recipe_lines.exists()
    if dish.has_recipe != has_lines:
        dish.has_recipe = has_lines
        dish.save(update_fields=['has_recipe', 'updated_at'])

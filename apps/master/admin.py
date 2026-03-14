from django.contrib import admin

from .models import Dish, DishRecipe, Ingredient


@admin.register(Ingredient)
class IngredientAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'unit_of_measure', 'base_qty_ref', 'is_active')
    list_filter = ('category', 'is_active', 'unit_of_measure')
    search_fields = ('name',)
    ordering = ('category', 'name')


@admin.register(Dish)
class DishAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'unit_type', 'has_recipe', 'is_active')
    list_filter = ('category', 'unit_type', 'is_active', 'has_recipe')
    search_fields = ('name', 'category')
    ordering = ('category', 'name')
    readonly_fields = ('has_recipe',)


@admin.register(DishRecipe)
class DishRecipeAdmin(admin.ModelAdmin):
    list_display = ('dish', 'ingredient', 'qty_per_unit', 'unit')
    list_filter = ('dish__category',)
    search_fields = ('dish__name', 'ingredient__name')
    autocomplete_fields = ('ingredient',)
    ordering = ('dish__name', 'ingredient__name')

from rest_framework import serializers

from .models import Dish, DishRecipe, Ingredient


class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = (
            'id', 'name', 'category', 'unit_of_measure',
            'base_qty_ref', 'is_active', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class DishRecipeSerializer(serializers.ModelSerializer):
    ingredient_name = serializers.CharField(source='ingredient.name', read_only=True)
    ingredient_uom = serializers.CharField(source='ingredient.unit_of_measure', read_only=True)

    class Meta:
        model = DishRecipe
        fields = (
            'id', 'ingredient', 'ingredient_name', 'ingredient_uom',
            'qty_per_unit', 'unit',
        )
        read_only_fields = ('id', 'ingredient_name', 'ingredient_uom')


class DishSerializer(serializers.ModelSerializer):
    recipe_lines = DishRecipeSerializer(many=True, read_only=True)

    class Meta:
        model = Dish
        fields = (
            'id', 'name', 'category', 'unit_type', 'is_active',
            'has_recipe', 'notes', 'recipe_lines', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'has_recipe', 'created_at', 'updated_at')

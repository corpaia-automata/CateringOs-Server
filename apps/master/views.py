from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.response import Response

from .filters import DishFilter, IngredientFilter
from .models import Dish, DishRecipe, Ingredient
from .serializers import DishRecipeSerializer, DishSerializer, IngredientSerializer


class IngredientViewSet(viewsets.ModelViewSet):
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer
    filterset_class = IngredientFilter
    search_fields = ['name']
    ordering_fields = ['name', 'category']


class DishViewSet(viewsets.ModelViewSet):
    queryset = Dish.objects.prefetch_related('recipe_lines__ingredient').all()
    serializer_class = DishSerializer
    filterset_class = DishFilter
    search_fields = ['name', 'category']
    ordering_fields = ['name', 'category']

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        # Prevent activating a dish that has no recipe lines
        if request.data.get('is_active') is True and not instance.has_recipe:
            return Response(
                {'detail': 'Cannot activate a dish that has no recipe lines.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().partial_update(request, *args, **kwargs)


class DishRecipeViewSet(viewsets.GenericViewSet):
    """
    Nested under dishes.
    GET  /api/master/dishes/{dish_pk}/recipe/  → all recipe lines for the dish
    PUT  /api/master/dishes/{dish_pk}/recipe/  → atomically replace all lines
    """
    serializer_class = DishRecipeSerializer

    def list(self, request, dish_pk=None):
        dish = get_object_or_404(Dish, pk=dish_pk)
        serializer = DishRecipeSerializer(
            dish.recipe_lines.select_related('ingredient').all(), many=True
        )
        return Response(serializer.data)

    def replace_all(self, request, dish_pk=None):
        dish = get_object_or_404(Dish, pk=dish_pk)

        lines_data = request.data if isinstance(request.data, list) else []
        serializer = DishRecipeSerializer(data=lines_data, many=True)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            dish.recipe_lines.all().delete()
            new_lines = [
                DishRecipe(dish=dish, **item)
                for item in serializer.validated_data
            ]
            DishRecipe.objects.bulk_create(new_lines)
            # bulk_create does not trigger signals — update has_recipe explicitly
            Dish.objects.filter(pk=dish.pk).update(has_recipe=bool(new_lines))

        dish.refresh_from_db()
        result = DishRecipeSerializer(
            dish.recipe_lines.select_related('ingredient').all(), many=True
        )
        return Response(result.data)

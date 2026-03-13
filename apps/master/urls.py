from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import DishRecipeViewSet, DishViewSet, IngredientViewSet

router = DefaultRouter()
router.register('ingredients', IngredientViewSet, basename='ingredient')
router.register('dishes', DishViewSet, basename='dish')

urlpatterns = [
    path('', include(router.urls)),
    # Nested recipe endpoint — GET list + PUT replace-all on collection URL
    path(
        'dishes/<str:dish_pk>/recipe/',
        DishRecipeViewSet.as_view({'get': 'list', 'put': 'replace_all'}),
        name='dish-recipe',
    ),
]

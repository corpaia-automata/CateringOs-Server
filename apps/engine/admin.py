from django.contrib import admin

from .models import EventIngredient


@admin.register(EventIngredient)
class EventIngredientAdmin(admin.ModelAdmin):
    list_display    = ('event', 'ingredient_name', 'category', 'total_quantity', 'unit', 'calculated_at')
    list_filter     = ('category',)
    search_fields   = ('ingredient_name', 'event__event_code')
    readonly_fields = ('event', 'ingredient', 'ingredient_name', 'category',
                       'total_quantity', 'unit', 'calculated_at')
    ordering        = ('event', 'category', 'ingredient_name')

    def has_add_permission(self, request):
        return False  # Written only by CalculationEngine

    def has_change_permission(self, request, obj=None):
        return False  # Read-only

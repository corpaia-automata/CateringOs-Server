from rest_framework import serializers

from .models import EventIngredient


class EventIngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventIngredient
        fields = (
            'id', 'event', 'ingredient',
            'ingredient_name', 'category',
            'total_quantity', 'unit',
            'calculated_at',
        )
        read_only_fields = fields

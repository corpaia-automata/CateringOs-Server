from rest_framework import serializers

from .models import EventMenuItem


class EventMenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventMenuItem
        fields = (
            'id',
            'event',
            'dish',
            'dish_name_snapshot',
            'unit_type_snapshot',
            'quantity',
            'recipe_snapshot',
            'sort_order',
            'created_at',
            'updated_at',
        )
        read_only_fields = (
            'id',
            'event',                  # set from URL in perform_create
            'dish_name_snapshot',     # frozen in save()
            'unit_type_snapshot',     # frozen in save()
            'recipe_snapshot',        # frozen in save()
            'created_at',
            'updated_at',
        )

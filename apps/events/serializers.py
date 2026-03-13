from rest_framework import serializers

from .models import Event


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = (
            'id', 'event_code',
            'customer_name', 'contact_number',
            'event_type', 'event_date', 'event_time',
            'venue', 'guest_count', 'service_type',
            'status', 'menu_locked', 'notes',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'event_code', 'menu_locked', 'created_at', 'updated_at')


class EventTransitionSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Event.Status.choices)

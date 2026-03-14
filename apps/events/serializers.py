from rest_framework import serializers

from .models import Event


class EventSerializer(serializers.ModelSerializer):
    # Frontend uses client_name / event_name / event_id — map to model fields
    client_name = serializers.CharField(source='customer_name')
    event_name  = serializers.CharField(source='customer_name', read_only=True)
    event_id    = serializers.CharField(source='event_code', read_only=True)

    class Meta:
        model = Event
        fields = (
            'id', 'event_code', 'event_id',
            'customer_name', 'client_name', 'event_name',
            'contact_number',
            'event_type', 'event_date', 'event_time',
            'venue', 'guest_count',
            'service_type', 'service_type_narration',
            'status', 'payment_status',
            'total_amount', 'advance_amount',
            'menu_locked', 'notes',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'event_code', 'event_id', 'event_name',
            'customer_name',  # client_name is the writable alias
            'menu_locked', 'created_at', 'updated_at',
        )
        extra_kwargs = {
            'contact_number':         {'required': False, 'default': ''},
            'event_time':             {'required': False, 'allow_null': True},
            'event_date':             {'required': False, 'allow_null': True},
            'event_type':             {'required': False, 'default': ''},
            'venue':                  {'required': False, 'default': ''},
            'notes':                  {'required': False, 'default': ''},
            'service_type_narration': {'required': False, 'default': ''},
            'payment_status':         {'required': False, 'default': ''},
            'total_amount':           {'required': False},
            'advance_amount':         {'required': False},
        }


class EventTransitionSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Event.Status.choices)

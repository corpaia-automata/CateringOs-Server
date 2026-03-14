from rest_framework import serializers

from apps.events.serializers import EventSerializer

from .models import Inquiry


class InquirySerializer(serializers.ModelSerializer):
    converted_event = EventSerializer(read_only=True)

    class Meta:
        model  = Inquiry
        fields = (
            'id', 'customer_name', 'contact_number',
            'source_channel', 'event_type', 'tentative_date',
            'guest_count', 'estimated_budget', 'notes', 'status', 'converted_event',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'converted_event', 'created_at', 'updated_at')

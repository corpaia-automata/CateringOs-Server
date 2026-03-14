from django.core.exceptions import ValidationError
from django.db import transaction

from apps.events.models import Event

from .models import Inquiry


class InquiryService:

    @staticmethod
    @transaction.atomic
    def convert_to_event(inquiry_id) -> Event:
        """
        Creates an Event from inquiry data, marks the inquiry as CONVERTED,
        and links the two via converted_event.
        Raises ValidationError if already converted.
        """
        try:
            inquiry = Inquiry.objects.select_for_update().get(pk=inquiry_id)
        except Inquiry.DoesNotExist:
            raise ValidationError(f'Inquiry {inquiry_id} not found.')

        if inquiry.status == Inquiry.Status.CONVERTED:
            raise ValidationError('This inquiry has already been converted to an event.')

        event = Event.objects.create(
            customer_name  = inquiry.customer_name,
            contact_number = inquiry.contact_number,
            event_type     = inquiry.event_type,
            event_date     = inquiry.tentative_date,
            guest_count    = inquiry.guest_count,
            service_type   = Event.ServiceType.BUFFET,  # default, staff can update
            notes          = inquiry.notes,
        )

        inquiry.status          = Inquiry.Status.CONVERTED
        inquiry.converted_event = event
        inquiry.save(update_fields=['status', 'converted_event', 'updated_at'])

        return event

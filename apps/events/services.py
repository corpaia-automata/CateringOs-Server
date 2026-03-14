from django.core.exceptions import ValidationError

from .models import Event


class EventService:

    @staticmethod
    def transition_status(event_id, new_status):
        """
        Validates new_status against VALID_TRANSITIONS and applies it.
        Raises ValidationError if the transition is not allowed.
        Returns the updated Event instance.
        """
        try:
            event = Event.objects.get(pk=event_id)
        except Event.DoesNotExist:
            raise ValidationError(f'Event {event_id} not found.')

        event.transition_to(new_status)
        return event

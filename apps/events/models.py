from django.db import models
from django.core.exceptions import ValidationError
from shared.mixins import BaseMixin


VALID_TRANSITIONS = {
    'DRAFT':       ['CONFIRMED', 'CANCELLED'],
    'CONFIRMED':   ['IN_PROGRESS', 'CANCELLED'],
    'IN_PROGRESS': ['COMPLETED', 'CANCELLED'],
    'COMPLETED':   [],
    'CANCELLED':   [],
}


class Event(BaseMixin):

    class ServiceType(models.TextChoices):
        BUFFET        = 'BUFFET',        'Buffet'
        TABLE_SERVICE = 'TABLE_SERVICE', 'Table Service'
        DELIVERY      = 'DELIVERY',      'Delivery'

    class Status(models.TextChoices):
        DRAFT       = 'DRAFT',       'Draft'
        CONFIRMED   = 'CONFIRMED',   'Confirmed'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        COMPLETED   = 'COMPLETED',   'Completed'
        CANCELLED   = 'CANCELLED',   'Cancelled'

    event_code     = models.CharField(max_length=30, unique=True, editable=False)
    customer_name  = models.CharField(max_length=255)
    contact_number = models.CharField(max_length=20, blank=True)
    event_type     = models.CharField(max_length=100)
    event_date     = models.DateField(db_index=True)
    event_time     = models.TimeField(null=True, blank=True)
    venue          = models.CharField(max_length=255, blank=True)
    guest_count    = models.PositiveIntegerField()
    service_type   = models.CharField(max_length=15, choices=ServiceType.choices)
    status         = models.CharField(max_length=15, choices=Status.choices, default=Status.DRAFT)
    menu_locked    = models.BooleanField(default=False)
    notes          = models.TextField(blank=True)

    class Meta:
        db_table = 'events'
        ordering = ['event_date', 'event_time']
        indexes = [
            models.Index(fields=['event_date', 'status']),
        ]

    def __str__(self):
        return f'{self.event_code} — {self.customer_name}'

    def save(self, *args, **kwargs):
        if not self.event_code:
            self.event_code = self._generate_event_code()
        super().save(*args, **kwargs)

    def _generate_event_code(self):
        from django.utils import timezone
        date_str = timezone.now().strftime('%Y%m%d')
        prefix = f'EVT-{date_str}-'
        # select_for_update locks the count query to prevent duplicate codes
        # under concurrent requests. Counts all_objects (inc. soft-deleted).
        last = (
            Event.all_objects
            .select_for_update()
            .filter(event_code__startswith=prefix)
            .count()
        )
        return f'{prefix}{str(last + 1).zfill(4)}'

    def transition_to(self, new_status):
        allowed = VALID_TRANSITIONS.get(self.status, [])
        if new_status not in allowed:
            raise ValidationError(
                f"Cannot transition from '{self.status}' to '{new_status}'. "
                f"Allowed: {allowed or 'none (terminal state)'}."
            )
        self.status = new_status
        self.save(update_fields=['status', 'updated_at'])

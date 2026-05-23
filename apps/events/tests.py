import datetime

from django.test import TestCase

from .filters import EventFilter
from .models import Event
from .serializers import EventSerializer


class EventSerializerCompatibilityTest(TestCase):

    def test_create_accepts_legacy_customer_name(self):
        serializer = EventSerializer(data={
            'customer_name': 'Legacy Client',
            'guest_count': 50,
            'service_type': Event.ServiceType.BUFFET,
        })

        self.assertTrue(serializer.is_valid(), serializer.errors)
        event = serializer.save()

        self.assertEqual(event.customer_name, 'Legacy Client')

    def test_create_accepts_client_name_alias(self):
        serializer = EventSerializer(data={
            'client_name': 'Alias Client',
            'guest_count': 50,
            'service_type': Event.ServiceType.BUFFET,
        })

        self.assertTrue(serializer.is_valid(), serializer.errors)
        event = serializer.save()

        self.assertEqual(event.customer_name, 'Alias Client')

    def test_partial_update_accepts_legacy_customer_name(self):
        event = Event.objects.create(
            customer_name='Original Client',
            guest_count=50,
            service_type=Event.ServiceType.BUFFET,
        )

        serializer = EventSerializer(
            event,
            data={'customer_name': 'Renamed Client'},
            partial=True,
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()
        event.refresh_from_db()

        self.assertEqual(event.customer_name, 'Renamed Client')


class EventFilterCompatibilityTest(TestCase):

    def test_legacy_date_range_filter_names_still_apply(self):
        included = Event.objects.create(
            customer_name='Included Client',
            event_date=datetime.date(2026, 1, 15),
            guest_count=50,
            service_type=Event.ServiceType.BUFFET,
        )
        Event.objects.create(
            customer_name='Excluded Client',
            event_date=datetime.date(2026, 2, 15),
            guest_count=50,
            service_type=Event.ServiceType.BUFFET,
        )

        filtered = EventFilter(
            {
                'event_date_from': '2026-01-01',
                'event_date_to': '2026-01-31',
            },
            queryset=Event.objects.all(),
        ).qs

        self.assertEqual(list(filtered), [included])

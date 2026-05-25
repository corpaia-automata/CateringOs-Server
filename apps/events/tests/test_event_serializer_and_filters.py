import datetime

from django.test import TestCase

from apps.events.filters import EventFilter
from apps.events.models import Event
from apps.events.serializers import EventSerializer


class EventSerializerCompatibilityTest(TestCase):
    def _event_payload(self, **overrides):
        payload = {
            'customer_name': 'Ali Hassan',
            'event_type': 'Wedding',
            'event_date': '2026-04-15',
            'guest_count': 300,
            'service_type': Event.ServiceType.BUFFET,
        }
        payload.update(overrides)
        return payload

    def test_create_accepts_customer_name_contract(self):
        serializer = EventSerializer(data=self._event_payload())

        self.assertTrue(serializer.is_valid(), serializer.errors)
        event = serializer.save()

        self.assertEqual(event.customer_name, 'Ali Hassan')

    def test_create_accepts_client_name_alias(self):
        payload = self._event_payload(client_name='Frontend Client')
        payload.pop('customer_name')
        serializer = EventSerializer(data=payload)

        self.assertTrue(serializer.is_valid(), serializer.errors)
        event = serializer.save()

        self.assertEqual(event.customer_name, 'Frontend Client')

    def test_patch_accepts_customer_name_contract(self):
        event = Event.objects.create(
            customer_name='Original Client',
            event_type='Wedding',
            event_date=datetime.date(2026, 4, 15),
            guest_count=300,
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
    def setUp(self):
        Event.objects.create(
            customer_name='Before Range',
            event_type='Wedding',
            event_date=datetime.date(2026, 3, 31),
            guest_count=100,
            service_type=Event.ServiceType.BUFFET,
        )
        Event.objects.create(
            customer_name='Inside Range',
            event_type='Wedding',
            event_date=datetime.date(2026, 4, 15),
            guest_count=300,
            service_type=Event.ServiceType.BUFFET,
        )
        Event.objects.create(
            customer_name='After Range',
            event_type='Wedding',
            event_date=datetime.date(2026, 5, 1),
            guest_count=200,
            service_type=Event.ServiceType.BUFFET,
        )

    def test_legacy_date_range_aliases_filter_events(self):
        event_filter = EventFilter(
            data={
                'event_date_from': '2026-04-01',
                'event_date_to': '2026-04-30',
            },
            queryset=Event.objects.all(),
        )

        self.assertTrue(event_filter.is_valid(), event_filter.errors)
        self.assertEqual(
            list(event_filter.qs.values_list('customer_name', flat=True)),
            ['Inside Range'],
        )

    def test_current_date_range_aliases_filter_events(self):
        event_filter = EventFilter(
            data={
                'event_date_after': '2026-04-01',
                'event_date_before': '2026-04-30',
            },
            queryset=Event.objects.all(),
        )

        self.assertTrue(event_filter.is_valid(), event_filter.errors)
        self.assertEqual(
            list(event_filter.qs.values_list('customer_name', flat=True)),
            ['Inside Range'],
        )

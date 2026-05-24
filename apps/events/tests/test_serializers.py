from django.test import SimpleTestCase

from apps.events.serializers import EventSerializer


class EventSerializerClientNameCompatibilityTest(SimpleTestCase):
    def _valid_payload(self, **overrides):
        payload = {
            'customer_name': 'Ali Hassan',
            'contact_number': '9876543210',
            'event_type': 'Wedding',
            'event_date': '2026-04-15',
            'event_time': '18:00:00',
            'venue': 'Grand Hall, Kozhikode',
            'guest_count': 300,
            'service_type': 'BUFFET',
            'notes': 'Vegetarian menu preferred',
        }
        payload.update(overrides)
        return payload

    def test_accepts_existing_customer_name_payloads(self):
        serializer = EventSerializer(data=self._valid_payload())

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data['customer_name'], 'Ali Hassan')

    def test_accepts_client_name_alias_payloads(self):
        payload = self._valid_payload(client_name='Frontend Client')
        payload.pop('customer_name')
        serializer = EventSerializer(data=payload)

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data['customer_name'], 'Frontend Client')

    def test_requires_a_customer_name_on_create(self):
        payload = self._valid_payload()
        payload.pop('customer_name')
        serializer = EventSerializer(data=payload)

        self.assertFalse(serializer.is_valid())
        self.assertIn('customer_name', serializer.errors)

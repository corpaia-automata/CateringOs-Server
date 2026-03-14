import django_filters

from .models import Event


class EventFilter(django_filters.FilterSet):
    event_date_from = django_filters.DateFilter(field_name='event_date', lookup_expr='gte')
    event_date_to   = django_filters.DateFilter(field_name='event_date', lookup_expr='lte')

    class Meta:
        model = Event
        fields = {
            'event_date':   ['exact'],
            'status':       ['exact'],
            'service_type': ['exact'],
            'event_type':   ['icontains'],
        }

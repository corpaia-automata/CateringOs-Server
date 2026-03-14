import django_filters

from .models import Inquiry


class InquiryFilter(django_filters.FilterSet):
    tentative_date_after  = django_filters.DateFilter(field_name='tentative_date', lookup_expr='gte')
    tentative_date_before = django_filters.DateFilter(field_name='tentative_date', lookup_expr='lte')
    event_type            = django_filters.CharFilter(field_name='event_type', lookup_expr='icontains')

    class Meta:
        model  = Inquiry
        fields = ['status', 'source_channel', 'tentative_date_after', 'tentative_date_before', 'event_type']

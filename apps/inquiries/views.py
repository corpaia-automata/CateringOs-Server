from django.core.exceptions import ValidationError
from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.events.serializers import EventSerializer
from shared.exports.excel_service import create_workbook, workbook_to_bytes

from .filters import InquiryFilter
from .models import Inquiry
from .serializers import InquirySerializer
from .services import InquiryService


class InquiryViewSet(viewsets.ModelViewSet):
    queryset         = Inquiry.objects.all()
    serializer_class = InquirySerializer
    filter_backends  = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class  = InquiryFilter
    search_fields    = ['customer_name', 'contact_number']
    ordering_fields  = ['created_at', 'tentative_date']
    ordering         = ['-created_at']

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'], url_path='export')
    def export(self, request):
        """GET /api/inquiries/export/ — download filtered leads as Excel."""
        queryset = self.filter_queryset(self.get_queryset())

        wb = create_workbook()
        ws = wb.active
        ws.title = 'Leads'

        headers = [
            'Customer Name', 'Contact Number', 'Source Channel',
            'Event Type', 'Tentative Date', 'Guests',
            'Estimated Budget', 'Status', 'Notes', 'Created At',
        ]
        ws.append(headers)

        for inquiry in queryset:
            ws.append([
                inquiry.customer_name,
                inquiry.contact_number or '',
                inquiry.get_source_channel_display(),
                inquiry.event_type or '',
                str(inquiry.tentative_date) if inquiry.tentative_date else '',
                inquiry.guest_count,
                float(inquiry.estimated_budget) if inquiry.estimated_budget else '',
                inquiry.get_status_display(),
                inquiry.notes or '',
                inquiry.created_at.strftime('%Y-%m-%d %H:%M') if inquiry.created_at else '',
            ])

        content = workbook_to_bytes(wb)
        response = HttpResponse(
            content,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        response['Content-Disposition'] = 'attachment; filename="leads.xlsx"'
        return response

    @action(detail=True, methods=['post'], url_path='convert')
    def convert(self, request, pk=None):
        """
        POST /api/inquiries/{id}/convert/
        Creates an Event from this inquiry and marks it CONVERTED.
        Returns the created Event object.
        """
        try:
            event = InquiryService.convert_to_event(pk)
        except ValidationError as exc:
            return Response({'detail': exc.message}, status=status.HTTP_400_BAD_REQUEST)

        return Response(EventSerializer(event).data, status=status.HTTP_201_CREATED)

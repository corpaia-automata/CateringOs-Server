from django.core.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.events.serializers import EventSerializer

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

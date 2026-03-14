from django.core.exceptions import ValidationError
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .filters import EventFilter
from .models import Event
from .serializers import EventSerializer, EventTransitionSerializer
from .services import EventService


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    filterset_class = EventFilter
    search_fields = ['event_code', 'customer_name', 'event_type', 'venue']
    ordering_fields = ['event_date', 'event_time', 'status', 'created_at']

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], url_path='transition')
    def transition(self, request, pk=None):
        serializer = EventTransitionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            event = EventService.transition_status(pk, serializer.validated_data['status'])
        except ValidationError as exc:
            return Response({'detail': exc.message}, status=status.HTTP_409_CONFLICT)

        return Response(EventSerializer(event).data)

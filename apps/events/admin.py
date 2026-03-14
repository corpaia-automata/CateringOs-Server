from django.contrib import admin

from .models import Event


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display  = ('event_code', 'customer_name', 'event_type', 'event_date', 'guest_count', 'service_type', 'status', 'menu_locked')
    list_filter   = ('status', 'service_type', 'event_date', 'menu_locked')
    search_fields = ('event_code', 'customer_name', 'event_type', 'venue')
    readonly_fields = ('event_code', 'menu_locked', 'created_at', 'updated_at')
    ordering = ('event_date', 'event_time')
    date_hierarchy = 'event_date'

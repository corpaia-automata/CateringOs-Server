from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.authentication.urls')),
    path('api/inquiries/', include('apps.inquiries.urls')),
    path('api/events/', include('apps.events.urls')),
    path('api/menu/', include('apps.menu.urls')),
    path('api/master/', include('apps.master.urls')),
    path('api/engine/', include('apps.engine.urls')),
    path('api/grocery/', include('apps.grocery.urls')),
    path('api/quotations/', include('apps.quotations.urls')),
    path('api/reports/', include('apps.reports.urls')),
]

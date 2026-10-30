from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("stylist.urls")),
]

# Uploaded photos. In production put these behind object storage or a web server.
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

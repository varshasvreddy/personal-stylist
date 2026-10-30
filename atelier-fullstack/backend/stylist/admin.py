from django.contrib import admin

from .models import Garment, Look, Profile

admin.site.register(Profile)
admin.site.register(Garment)
admin.site.register(Look)

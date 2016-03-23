from django.contrib import admin

# Register your models here.

from models import Studio, Reservation

admin.site.register(Studio)
admin.site.register(Reservation)

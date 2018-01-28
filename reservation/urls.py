from django.conf.urls import include, url

from . import views

urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^modifyWeek$', views.modifyWeek , name = 'modifyWeek'),
    url(r'^addBooking$', views.addBooking , name = 'addBooking'),
    url(r'^deleteBooking$', views.deleteBooking , name = 'deleteBooking'),
    

]
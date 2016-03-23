from __future__ import unicode_literals

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

# Create your models here.
	
class Studio(models.Model):
	name = models.CharField(max_length=50)
	status = models.CharField(max_length=50)
	is_piano = models.BooleanField(default=False)
	
	def __str__(self):
		return self.name


class Reservation(models.Model):
	made_by = models.ForeignKey(User)
	studio_key = models.ForeignKey(Studio)
	''' date when the reservation has been made '''
	made_when = models.DateTimeField()
	''' start date time of the reservation '''
	date_start = models.DateTimeField()
	date_end = models.DateTimeField()
	''' name of the song that will be interpreted '''
	song = models.CharField(max_length=250, default="")
	''' name of the author of the song '''
	author = models.CharField(max_length=250, default="")
	
	
	def __str__(self):
		strMsg = 'reservation of studio: {0}'.format(self.studio_key.__str__())
		#strMsg += ' --- made= {0}'.format(self.made_when.strftime('%d/%m/%Y'))
		''' show local time '''
		strMsg += ' --- starting= {0}'.format(timezone.localtime(self.date_start))
		strMsg += ' --- finishing= {0}'.format(timezone.localtime(self.date_end))
		strMsg += ' --- song= {0}'.format(self.song)
		return  strMsg
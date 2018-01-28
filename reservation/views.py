#-*- coding: utf-8 -*-
import locale
import json
import urllib2
from django.views.decorators.csrf import csrf_exempt
from django.core import serializers

# Create your views here.
from django.http import HttpResponse
from django.template import loader

from datetime import datetime , timedelta
from models import Studio, Reservation
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required

French_Locale = "French"


def weekDays(year, week):
    ''' utiliser datetime pour pouvoir ajouter des heures '''
    referenceThursday = datetime(year, 1, 4) # Le 4 janvier est toujours en semaine 1
    dayInTheFirstWeek = referenceThursday.weekday()
    jours = 7*(week - 1) - dayInTheFirstWeek
    lundi = referenceThursday + timedelta(days=jours)
    return [ (lundi + timedelta(days=n)).strftime("%A %d-%B-%Y") for n in xrange(7)]


def semaine(annee, sem):
    ''' utiliser datetime pour pouvoir ajouter des heures '''
    ref = datetime(annee, 1, 4) # Le 4 janvier est toujours en semaine 1
    j = ref.weekday()
    jours = 7*(sem - 1) - j
    lundi = ref + timedelta(days=jours)
    return [lundi + timedelta(days=n) for n in xrange(7)]


@login_required
def index(request):
    
    template = loader.get_template('reservation/index.html')
    #print 'today is = {0}'.format(datetime.today())

    #print ' current user is: {0}'.format(request.user)
    #print ' current user id is: {0}'.format(request.user.id)

    week_number = datetime.today().isocalendar()[1]
    context = {
        'week_number': week_number,
        'year': datetime.today().year
    }
    return HttpResponse(template.render(context, request))

@login_required
def modifyWeek(request):
    locale.setlocale(locale.LC_TIME, French_Locale)

    print request
    if (request.method == 'GET'):
        
        if request.GET['action'] == 'first':
            week_number = datetime.today() .isocalendar()[1]
            list_of_days = weekDays(datetime.today().year , week_number)
        elif request.GET['action'] == 'inc':
            week_number = int(request.GET['week']) + 1
            ''' need to check whether a year changes occur here '''
            list_of_days = weekDays(datetime.today().year , week_number)
        else:
            week_number = int(request.GET['week']) - 1
            list_of_days = weekDays(datetime.today().year , week_number)

        #print 'modified week number = {0}'.format(week_number)
       
        users = serializers.serialize('json', list(User.objects.all()))
        studios = serializers.serialize('json', list(Studio.objects.all()))
        reservations = serializers.serialize('json', list(Reservation.objects.all().order_by("date_start")))

        response_data = {
                    'current_user_id': request.user.id,
                    'week_number': week_number,
                    'year': datetime.today().year,
                    'list_of_days': list_of_days,
                    'users': users,
                    'studios': studios,
                    'reservations': reservations,
                    }
        ''' need to encode french months like février encoding="latin-1" '''
        return HttpResponse(json.dumps(response_data, ensure_ascii=False, encoding="latin-1"), content_type="application/json")


def convertEnglish2French(selectedDate):
    if (str(selectedDate).startswith("Monday")):
        return 'lundi'
    elif (str(selectedDate).startswith("Tuesday")):
        return 'mardi'
    elif (str(selectedDate).startswith("Wednesday")):
        return 'mercredi'
    elif (str(selectedDate).startswith("Thursday")):
        return 'jeudi'
    elif (str(selectedDate).startswith("Friday")):
        return 'vendredi'
    else:
        return 'dimanche'
    
   

def computeSelectedDate(selectedDate, week_number, year):
    for day in semaine(year, week_number):
        print day
        print day.strftime('%A')
        if str(convertEnglish2French(selectedDate)).startswith(day.strftime('%A')):
            return day
    return None


@login_required
@csrf_exempt
def addBooking(request):
    locale.setlocale(locale.LC_TIME, French_Locale)

    print 'add booking'
    if request.method == 'POST':
        print 'method is POST {0}'.format(request.POST)
        
        ''' date has the following format Tuesday-16h00 '''
        theDate = request.POST['date']
        #print 'Date and Hour of the slot: {theDate}'.format(theDate=theDate)
        week_number = request.POST['week']
        year = request.POST['year']
        
        song = urllib2.unquote(request.POST['song'])
        studio_key = request.POST['studio']
        
        ''' date has the following format Tuesday-16h00 '''
        date_start = computeSelectedDate(theDate, int(week_number), int(year))
        startingHours = str(theDate).split('-')[1]
        
        ''' date has the following format Tuesday-16h00 '''
        hours =  int(str(startingHours).split('h')[0])
        #print 'Starting Hours: {hours}'.format(hours=hours)

        ''' starting period h00, h15, h30, h45 '''
        startingMinutes = int(str(request.POST['start'])[1:])
        
        date_start += timedelta ( hours = hours, minutes = startingMinutes )
        print date_start.strftime("%A %d-%B-%Y %H:%M:%S")
        
        date_end = computeSelectedDate(theDate, int(week_number), int(year))
        ''' use duration to compute the end  --- duration = 15 minutes '''
        duration = request.POST['duration']
        endingMinutes = 0
        if (duration == '15 minutes') or (duration == '30 minutes') or (duration == '45 minutes'):
            endingMinutes = startingMinutes + int(str(duration).split(' ')[0])
            if (endingMinutes > 60):
                hours = hours + 1
                endingMinutes = endingMinutes - 60
        elif (duration == '1 hour'):
            hours = hours +1
            endingMinutes = startingMinutes
        else:
            hours  = hours
            endingMinutes = startingMinutes
        
        date_end += timedelta ( hours = hours , minutes = endingMinutes )
        print date_end.strftime("%A %d-%B-%Y %H:%M:%S")
        list_of_days = weekDays(datetime.today().year, int(week_number))
        
        try:
            reservation = Reservation (
                        made_by = request.user,
                        studio_key = Studio.objects.get(pk=studio_key),
                        made_when = datetime.now(),
                        date_start = date_start,
                        date_end = date_end,
                        song = song,
                        author = "")
            ''' record the new reservation '''
            reservation.save()
        except Exception as e:
            print 'exception= {e}'.format(e=e)
            
        users = serializers.serialize('json', list(User.objects.all()))
        studios = serializers.serialize('json', list(Studio.objects.all()))
        reservations = serializers.serialize('json', list(Reservation.objects.all().order_by("date_start")))

        response_data = {
                    'current_user_id': request.user.id,
                    'week_number': week_number,
                    'list_of_days': list_of_days,
                    'users': users,
                    'studios': studios,
                    'reservations': reservations,
                    }
        ''' need to encode french months like février '''
        return HttpResponse(json.dumps(response_data, ensure_ascii=False, encoding="latin-1"), content_type="application/json")

    
@login_required
@csrf_exempt
def deleteBooking(request):
    locale.setlocale(locale.LC_TIME, French_Locale)

    print 'delete booking'
    if (request.method == 'POST'):
        print 'method id POST {0}'.format(request.POST)
        week_number = int(request.POST['week'])
        list_of_days = weekDays(datetime.today().year, int(week_number))
        print list_of_days
        
        reservation = Reservation.objects.get(pk=request.POST['pk'])
        user_id = reservation.made_by.id
        print ' user who mades the reservation = {0}'.format(reservation.made_by)
        ''' check if current user is the owner of the reservation '''
        if (request.user == User.objects.get(pk=user_id)):
            print 'the current user is the owner of the reservation '
            
            print ''' proceed with the deletion of the reservation '''
            reservation.delete()
        else:
            print ' the current user is not the owner of the reservation '
            
        users = serializers.serialize('json', list(User.objects.all()))
        studios = serializers.serialize('json', list(Studio.objects.all()))
        ''' the following order is needed before sending data to the templates '''
        reservations = serializers.serialize('json', list(Reservation.objects.all().order_by("date_start")))

        response_data = {
                    'current_user_id': request.user.id,
                    'week_number': week_number,
                    'list_of_days': list_of_days,
                    'users': users,
                    'studios': studios,
                    'reservations': reservations,
                    }
        return HttpResponse(json.dumps(response_data), content_type="application/json")
        



    
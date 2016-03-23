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
        #template = loader.get_template('reservation/index.html')

        #print 'modify week = {0}'.format(request.GET['week'])    
        #print 'modify week = {0}'.format(request.GET['action'])
        
        if request.GET['action'] == 'first':
            week_number = datetime.today() .isocalendar()[1]
            list_of_days = computeListOfDays()
        elif request.GET['action'] == 'inc':
            week_number = int(request.GET['week']) + 1
            ''' need to check whether a year changes occur here '''
            list_of_days = computeNewWeekListOfDays(week_number)
        else:
            week_number = int(request.GET['week']) - 1
            if (week_number <= 0):
                week_number = 0
            list_of_days = computeNewWeekListOfDays(week_number)

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


def semaine(annee, sem):
    ''' utiliser datetime pour pouvoir ajouter des heures '''
    ref = datetime(annee, 1, 4) # Le 4 janvier est toujours en semaine 1
    j = ref.weekday()
    jours = 7*(sem - 1) - j
    lundi = ref + timedelta(days=jours)
    return [lundi + timedelta(days=n) for n in xrange(7)]


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
        print 'Date and Hour of the slot: {theDate}'.format(theDate=theDate)
        week_number = request.POST['week']
        year = request.POST['year']
        
        song = urllib2.unquote(request.POST['song'])
        ''' duration = 15 minutes '''
        duration = request.POST['duration']
        studio_key = request.POST['studio']
        ''' starting period h00, h15, h30, h45 '''
        start = request.POST['start']
        
        date_start = computeSelectedDate(theDate, int(week_number), int(year))
        startingHours = str(theDate).split('-')[1]
        hours =  int(str(startingHours).split('h')[0])
        print 'Starting Hours: {hours}'.format(hours=hours)
        date_start += timedelta ( hours = hours, minutes = int(str(start)[1:]) )
        print date_start.strftime("%A %d-%B-%Y %H:%M:%S")
        date_end = date_start
        date_end += timedelta ( hours = int(str(startingHours).split('h')[0]))
        print date_end.strftime("%A %d-%B-%Y %H:%M:%S")
        list_of_days = computeNewWeekListOfDays(int(week_number))
        
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
        list_of_days = computeNewWeekListOfDays(week_number)
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
        

def computeNewWeekListOfDays(new_week_number):
    list_of_days = []
    current_week = datetime.today().isocalendar()[1]
    if (current_week < new_week_number):
        #print 'increment week number'
        day_counter = 0
        next_day = datetime.today()
        while next_day.isocalendar()[1] < new_week_number :
            try:
                next_day = datetime.today() + timedelta( days = day_counter)
            except:
                next_day = datetime.today()
            #print next_day.isocalendar()[1]
            day_counter = day_counter + 1
            
        for i in range(7):
            day = next_day + timedelta(days = i)
            #print day
            list_of_days.append(day.strftime("%A %d-%B-%Y"))
            
    else:
        day_counter = 0
        next_day = datetime.today()
        while next_day.isocalendar()[1] > new_week_number:
            try:
                next_day = datetime.today() - timedelta( days = day_counter)
            except:
                next_day = datetime.today()
            #print next_day.isocalendar()[1]
            day_counter = day_counter + 1

        day_of_week =  next_day.weekday()
    
        to_beginning_of_week = timedelta(days = day_of_week)
        beginning_of_week =  next_day - to_beginning_of_week
        #print 'first day of the week = {0}'.format(beginning_of_week)
          
        for i in range(7):
            day = beginning_of_week + timedelta(days = i)
            #print day
            list_of_days.append(day.strftime("%A %d-%B-%Y"))
       
    return list_of_days


def computeListOfDays():
    ''' The date object contains a weekday() method.
    this returns 0 for monday 6 for sunday. '''
    
    day_of_week =  datetime.today().weekday()
    
    to_beginning_of_week = timedelta(days = day_of_week)
    beginning_of_week =  datetime.today() - to_beginning_of_week
    #print 'first day of the week = {0}'.format(beginning_of_week)

    #to_end_of_week = timedelta(days = 6 - day_of_week)
    #end_of_week = datetime.today()  + to_end_of_week
    #print 'last day of the week= {0}'.format(end_of_week)
    
    list_of_days = []
    for i in range(7):
        day = beginning_of_week + timedelta(days = i)
        #print day.strftime("%A %d-%B-%Y")
        list_of_days.append(day.strftime("%A %d-%B-%Y"))
        
    return list_of_days
    
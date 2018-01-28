
//event triggered when document is ready
$(document).ready(init);

var weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
var joursSemaine = ['Lundi', 'Mardi', 'Mercredi',]
//javascript getDay starts on Sunday 
var javascriptWeekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
var studioNames = ['One', 'Two', 'Three'];
// hour where the schedule starts
var startHour = 9
var endHour = 20
var APP = APP || {};

function init() {
	//console.log(' window loaded -- init ');
	// add the table with the Hours for each day of the week
	addHoursRows();

	// attach button to listener
	var btnNextWeek = document.getElementById('btnNextWeek'); 
	if (btnNextWeek != undefined) {
		//console.log(' init: attach click event to next week button ');
		addEvent( btnNextWeek , 'click' , nextWeek );
	}

	var btnPreviousWeek = document.getElementById('btnPreviousWeek');
	if (btnPreviousWeek != undefined) {
		//console.log(' init: attach click event to previous week button ');
		addEvent( btnPreviousWeek , 'click' , previousWeek );
	}
	// load the first list of days
	loadFirstListOfDays();

}

function loadFirstListOfDays() {
	//console.log ( ' load first list of days ');
	// get the content of the week number
	var weekNumber = $("#weekNumber").text();
	if (weekNumber.length>0) {
		//console.log(' loadFirstListOfDays: week number is correctly defined ');
		// use ajax to get the data => after getting the html template
		$.ajax( { 	
			method: 'get',
			url :  "modifyWeek",
			data: 'week=' + weekNumber + '&action=first',
			async : true,
			success: function(data, status) {
				//alert("Data: " + data + "\nStatus: " + status);
				var dataJson = eval(data);
				//alert (dataJson['week_number']);
				$("#weekNumber").text(dataJson['week_number']);
				addWeekDays(dataJson);
			}
		} );
	}
}

function dateIsIntheCurrentWeek(date , dataJson) {

	var list_of_days = dataJson['list_of_days'];
	for (var day in list_of_days) {
		var aDayOfTheWeek = list_of_days[day];
		//alert ( aDayOfTheWeek.split(' ')[1] );
		//alert ( new Date (aDayOfTheWeek.split(' ')[1]))
		var frenchDate = aDayOfTheWeek.split(' ')[1];
		var day = parseInt(frenchDate.split('-')[0]);
		var frenchMonthStr = frenchDate.split('-')[1];
		var month = 0;
		$.each([ 'janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'], function( index, value ) {
			if (frenchMonthStr == value ) {
				month = index ;
			}
		});
		var year = parseInt(frenchDate.split('-')[2]);
		var internalDate = new Date ( year, month, day);
		//console.log ( 'date is in current week= ' + internalDate + ' input= ' + aDayOfTheWeek);
		if ( (date.getFullYear() ==  internalDate.getFullYear()) 
				&& (date.getMonth() ==  internalDate.getMonth()) 
				&& (date.getDate() == internalDate.getDate()) ) {
			//console.log ( 'dateIsIntheCurrentWeek: date = ' + date + ' is in the current week ');
			return true;
		}
	}
	return false;
}

function deleteBooking(element) {
	
	var weekNumber = $("#weekNumber").text();
	var closestTh = $(element).closest('th');
	console.log ( closestTh );
	
	var secondTd = $(element).closest('tr').children('td')[1];
	var thirdTd =  $(element).closest('tr').children('td')[2];
	console.log ( $(thirdTd).children('div').html() );
	var song = $(thirdTd).children('div').html();
	var timeSlot = $(secondTd).children('div').html();
	
	var title = 'SVP veuillez confirmer la suppression ?';
	$("#dialog-confirm").dialog({
        resizable: false,
        modal: true,
        title: title,
        open: function() {
            var markup = ' réservation pour <mark>' + song + '</mark> programmée à <mark>' + timeSlot + '</mark>';
            $(this).html(markup);
          },
        height: 150,
        width: 400,
        buttons: {
            "Oui": function () {
                $(this).dialog('close');
    			console.log (' delete booking - primary key= ' + element.id );
    			if ((element.id != undefined) && (element.id > 0)) {
    				$.ajax( { 	
    					method: 'post',
    					url :  "deleteBooking",
    					data: 'week=' + weekNumber + '&pk=' + element.id,
    					async : true,
    					success: function(data, status) {
    						console.log ("Data: " + data + "\nStatus: " + status);
    						var dataJson = eval(data);
    						//alert (dataJson['week_number']);
    						$("#weekNumber").text(dataJson['week_number']);
    						addWeekDays(dataJson);
    					},
    					error: function(data, status) { 
    	                    alert("Error: " + status + " SVP veuillez contactez votre administrateur"); 
    	                }
    				} );		
    			}
    			$("#dialog-confirm").html('');
    			//$(this).remove();
    		},
            "Non": function () {
                $(this).dialog('close');
                console.log ( 'suppression was cancelled !!!');
                $("#dialog-confirm").html('')
                //$(this).remove();
            }
        }
    });
}


function addOneReservation(reservation, dataJson ) {
	
	var users = eval(dataJson['users']);
	var studios = eval(dataJson['studios']);
	var reservations = eval(dataJson['reservations']);
	var current_user_id = eval(dataJson['current_user_id']);
	
	//console.log ( ' reservation id= ' + reservations[reservation].pk );
	// for each reservation we add a new row to the table that is inside a Day-Hour cell
	var date_start = new Date(reservations[reservation].fields.date_start);
	//console.log ( ' reservation is on = '+ javascriptWeekDays[date_start.getDay()] );

	var hours = date_start.getHours();
	//console.log ( ' reservation is at = '+ hours +  ' hours' );

	var tableId = javascriptWeekDays[date_start.getDay()];
	var divId = javascriptWeekDays[date_start.getDay()];
	var studioId = reservations[reservation].fields.studio_key;
	var studioName = "Studio" + studioNames[studioId-1];

	var made_by_id = reservations[reservation].fields.made_by;
	var made_by = users[made_by_id-1].fields.first_name + ' ' + users[made_by_id-1].fields.last_name;

	var strHours = "";
	if (hours < 10){
		// table id is rounded to a full hour
		tableId +=  '-' + '0' + hours.toString() + 'h00';
		// div id is the exact hours minutes as defined at reservation time
		divId +=  '0' + hours.toString() + 'h' + date_start.getMinutes().toString();
		if (date_start.getMinutes() < 10) {
			strHours = '0' + hours.toString() + 'h0' + date_start.getMinutes().toString();
		} else {
			strHours = '0' + hours.toString() + 'h' + date_start.getMinutes().toString();
		}

	} else {
		tableId += '-' + hours.toString() + 'h00';
		divId += hours.toString() + 'h' + date_start.getMinutes().toString();
		if (date_start.getMinutes() < 10) {
			strHours = hours.toString() + 'h0' + date_start.getMinutes().toString();
		} else {
			strHours = hours.toString() + 'h' + date_start.getMinutes().toString();
		}
	}
	// add a row at the end of this table
	// add the row to each internal table
	$("#"+tableId + " tbody").append($('<tr class="reservation" >'));
	// now add three td
	// first td contains the image of the studio or the piano room
	$("#"+tableId + " tbody").find('tr:last').append($('<td>'));
	var newDivContent = '<div id="' + divId + studioName + '"';
	newDivContent += ' class="' + studioName + '"';
	newDivContent += ' onclick="toggle(this.id)" title="reservation made by ' + made_by + '" >';
	$("#"+tableId + " tbody").find('td:last').append(newDivContent);

	// prepare the dialog
	var date_end = new Date(reservations[reservation].fields.date_end);
	//console.log (' studio key is: ' + reservations[reservation].fields.studio_key );
	var realStudioName = "";
	if (studios != undefined){
		realStudioName = studios[reservations[reservation].fields.studio_key-1].fields.name;
	}

	var txtMsg = "<div id='"+divId+studioName+"txt' title='"+realStudioName+"' class='txtArea' >";
	txtMsg += "<p>";
	txtMsg += " réservation faite par: <mark>" + made_by  + "</mark><br />";
	txtMsg += " date et heure: <mark>" + date_start.toString()  + "</mark><br />";
	if (date_start.getMinutes() < 10){
		txtMsg += " débute à: <mark>" + hours.toString() + "h0" + date_start.getMinutes().toString() + "</mark><br />";
	} else {
		txtMsg += " débute à: <mark>" + hours.toString() + "h" + date_start.getMinutes().toString() + "</mark><br />";
	}

	txtMsg += " se termine à: <mark>" + date_end.getHours().toString() + "h" ;
	if ( date_end.getMinutes() < 10 ){
		txtMsg += "0" + date_end.getMinutes().toString() + "</mark><br />";
	} else {
		txtMsg += date_end.getMinutes().toString() + "</mark><br />";
	}
	txtMsg += " chanson: <mark>" + reservations[reservation].fields.song + "</mark><br />";
	if ( reservations[reservation].fields.author.toString().length > 0 ) {
		txtMsg += " auteur de la chanson: <mark>" + reservations[reservation].fields.author + "</mark><br />";
	}
	txtMsg += "</p>" ;
	txtMsg += "</div>";
	// set the prepared text as the content of the div
	$("#"+divId+studioName).html( txtMsg );
	// dialog options
	var opt = {
			autoOpen: false,
			modal: false,
			width: 400,
			height: 200,
	};
	$("#"+divId+studioName+"txt").dialog(opt);

	// second td contains the hours where the reservation starts
	$("#"+tableId + " tbody").find('tr:last').append($('<td>'));
	var secondDivContent = '<div class="gold" >' + strHours + '</div>';
	$("#"+tableId + " tbody").find('td:last').append(secondDivContent);

	// last td contains the name of the song
	$("#"+tableId + " tbody").find('tr:last').append($('<td>'));
	var thirdDivContent = '<div class="song click" >' + reservations[reservation].fields.song + '</div>';
	$("#"+tableId + " tbody").find('td:last').append(thirdDivContent);

	// if the user is owner of the reservation he or she might delete it
	//console.log ( "current user id: " + current_user_id );
	//console.log ( "reservation made by: " + reservations[reservation].fields.made_by );
	if (current_user_id == reservations[reservation].fields.made_by) {
		//console.log ( " reservation is made by the current user ");
		// current user is allowed to suppress the reservation
		// second td contains the hours where the reservation starts
		$("#"+tableId + " tbody").find('tr:last').append($('<td>'));
		var fourthDivContent = '<div class="delete" ';
		fourthDivContent += ' id="' + reservations[reservation].pk.toString() + '" '; 
		// the id is corresponding to the primary key of the reservation in the PostGres database
		fourthDivContent += ' onclick="deleteBooking(this)" title="cliquez pour supprimer la réservation" ></div>';
		$("#"+tableId + " tbody").find('td:last').append(fourthDivContent);

	}
	
	// element with class edit
	$('.click').editable(function(value, settings) {
	     console.log(this);
	     console.log(value);
	     console.log(settings);
	     return(value);
	  }, {
	     type    : 'text',
	     submit  : 'OK',
	 });
}

function insertReservations(dataJson) {
	current_user_id = eval(dataJson['current_user_id']);
	// loop through the users
	users = eval(dataJson['users']);
	for (var user in users) {
		//alert ( users[user].fields.first_name + ' ' + users[user].fields.last_name );
	}

	studios = eval(dataJson['studios']);
	// remove all previous reservations
	for (var studioId in studios) {
		//alert ( studios[studio].fields.name );
		// predefined class names = StudioOne and StudioTwo
		var studioName = "Studio" + studioNames[studioId];
		// remove all div with class Studio one or studio two
		//$("div").remove( "."+studioName );
		var htmlCollection = document.getElementsByClassName(studioName);
		if ((htmlCollection != undefined) && (htmlCollection.length>0)) {
			$("div").remove(studioName);
		}
	}
	// remove all <td> with class reservation
	$("tr").remove(".reservation");

	// get all reservations
	reservations = eval(dataJson['reservations']);

	// add the reservation	
	for (var reservation in reservations) {
		//alert ( 'studio= ' + reservations[reservation].fields.studio_key + ' date start= ' + reservations[reservation].fields.date_start );
		var date_start = new Date(reservations[reservation].fields.date_start);
		if (dateIsIntheCurrentWeek( date_start , dataJson)) {
			//console.log ( ' add one reservation: ' + date_start.toString());
			//addOneReservation(reservation, reservations, studios, users, current_user_id);
			addOneReservation(reservation, dataJson);
		}
	}
}

function toggle(id) {
	// display or hide the details of a reservation
	id = id + 'txt';
	//$("#"+id).dialog();
	if ($("#"+id).dialog("isOpen") == false) {
		$("#"+id).dialog("open");
	} else {
		$("#"+id).dialog("close");
	}
	$("#"+id).dialog({autoOpen: false});
}

function nextWeek() {
	//console.log ( ' next week ');
	// clean all selection tools related to adding new bookings
	deleteBookingArtifacts();
	// delete all class ui-dialog - jquery dialog
	$('.ui-dialog').each(function() {
		$(this).remove();
	});
	// disable the buttons
	$("#btnPreviousWeek").prop('disabled',true);
	$("#btnNextWeek").prop('disabled',true);
	// get the content of the week number
	var weekNumber = $("#weekNumber").text();
	//alert (' click on next Week ' + weekNumber);
	$.ajax( { 	method: 'get',
		url :  "modifyWeek",
		data: 'week=' + weekNumber + '&action=inc',
		async : true,
		success: function(data, status) {
			//alert("Data: " + data + "\nStatus: " + status);
			var dataJson = eval(data);
			//alert (dataJson['week_number']);
			$("#weekNumber").text(dataJson['week_number']);
			addWeekDays(dataJson);
		}
	} );
	// enable the buttons
	$("#btnPreviousWeek").prop('disabled',false);
	$("#btnNextWeek").prop('disabled',false);
}

function previousWeek() {
	//console.log (' previous week ');
	// clean all selection tools related to adding new bookings
	deleteBookingArtifacts();
	// delete all class ui-dialog - jquery dialog
	$('.ui-dialog').each(function() {
		$(this).remove();
	});
	// disable the buttons
	$("#btnNextWeek").prop('disabled',true);
	$("#btnPreviousWeek").prop('disabled',true);

	var weekNumber = $("#weekNumber").text();
	//alert (' click on previous week ' + weekNumber);
	$.ajax( { 	method: 'get',
		url :  "modifyWeek",
		data: 'week=' + weekNumber + '&action=dec',
		async : true,
		success: function(data, status) {
			//alert("Data: " + data + "\nStatus: " + status);
			var dataJson = eval(data);
			//alert (dataJson['week_number']);
			$("#weekNumber").text(dataJson['week_number']);
			addWeekDays(dataJson);
		}
	} );
	// enable the buttons
	$("#btnPreviousWeek").prop('disabled',false);
	$("#btnNextWeek").prop('disabled',false);

}

function addWeekDays(dataJson) {
	// create global variable
	APP.studios = eval(dataJson['studios']);
	//console.log( ' add week days ');
	// change the days of the week in the upper list
	var list_of_days = dataJson['list_of_days'];
	for ( var idDays in list_of_days ) {
		//alert ( list_of_days[idDays] );
		var dayId = list_of_days[idDays].split(' ')[0];
		$('#'+dayId).html(list_of_days[idDays]);
	}
	// add the reservations
	insertReservations(dataJson);
}

function addHoursRows() {

	//console.log ( ' add Hours Row' );
	// hours from 8h00 to 19h00
	for (var hour = startHour; hour < endHour; hour++) {
		// Runs from 8 o clock to 19h00.
		//console.log('Walking one hour');
		var newRowContent = $('<tr>');
		newRowContent.addClass('grey');
		if (hour < 10) {
			newRowContent.append( $('<td class="hours">').html( '0' + hour.toString() + 'h00' ) ); 
		} else {
			newRowContent.append( $('<td class="hours">').html(  hour.toString() + 'h00' ) ); 
		}			
		// add the Add button to create a slot on the same row
		// show only Monday to Friday
		for (var day = 0; day < 5 ; day++) {
			// compute a unique id
			var uniqueId = weekDays[day];
			if (hour < 10){
				uniqueId += '-' + '0' + hour.toString() + 'h00' ;
			} else {
				uniqueId += '-' + hour.toString() + 'h00' ;
			}
			// append a td to the new row = use this td as a container
			newRowContent.append($('<td>'));
			// append a table 
			newRowContent.find('td:last').append($('<table class="container" id="' + uniqueId + '" >'));
		}
		// add the row to each internal table
		$("#HoursTable tbody").append(newRowContent);

	}
	// add to each table with class container a table row
	var divStr = '<div class="btn_add" ';
	divStr += ' onclick="add_slot($(this))" title="Cliquez pour ajouter une réservation."></div>';
	$('.container').each(function() {
		$(this).append('<tr>');
		$(this).find('tr:last').append($('<td class="slot">').html(divStr));
	});
}

/*
 * exchange with the server make a booking
 */

function addBooking(element) {
	var weekNumber = $("#weekNumber").text();
	var year = $("#year").text();

	var studioPrimaryKey = $( "#studioSelection option:selected" ).val();
	var startingHour = $( "#startSelection option:selected" ).text();
	var duration = $( "#durationSelection option:selected" ).text();
	var selectedDate = $(element).closest('table').attr('id') ;
	var song = $("#songSelection").val();
	
	data = 'week=' + weekNumber ;
	data += '&date=' + selectedDate ;
	data += '&year=' + year ;
	data += '&studio=' + studioPrimaryKey ;
	data += '&start=' + startingHour ;
	data += '&duration=' + duration ;
	data += '&song=' + encodeURIComponent(song);
	console.log ( ' add booking ');
	$.ajax( { 	
		method: 'post',
		url :  "addBooking",
		data: data ,
		async : true,
		success: function(data, status) {
			//alert("Data: " + data + "\nStatus: " + status);
			var dataJson = eval(data);
			//alert (dataJson['week_number']);
			$("#weekNumber").text(dataJson['week_number']);
			addWeekDays(dataJson);
			deleteBookingArtifacts();
		}
	} );
}

function deleteBookingArtifacts() {
	// suppress all temporary td
	$.each( ['#temporaryStudio', '#temporaryDuration', '#temporaryStart', '#temporaryAddButton', '#temporarySong' ], function(key, value ) {
		$(value).remove();
	});

}

function studioSelectionChanged() {
	//console.log ( $( "#studioSelection option:selected" ).text() );
	//console.log ( $( "#studioSelection option:selected" ).val() );
	// set button as enabled if conditions are satisfied
	setAddButtonEnabled();
}

function startSelectionChanged() {
	//console.log ( $( "#startSelection option:selected" ).text() );
	//console.log ( $( "#startSelection option:selected" ).val() );
	// set button as enabled if conditions are satisfied
	setAddButtonEnabled();
}

function durationSelectionChanged() {
	//console.log ( $( "#durationSelection option:selected" ).text() )
	//console.log ( $( "#durationSelection option:selected" ).val() );
	// set button as enabled if conditions are satisfied
	setAddButtonEnabled();
}

function songChanged() {
	//console.log ( $( "#songSelection" ).val() );
	// set button as enabled if conditions are satisfied
	setAddButtonEnabled();
}

function setAddButtonEnabled() {
	var studioSelected =  false;
	try {
		studioSelected = ( Number($( "#studioSelection option:selected" ).val()) > 0);
	} 
	finally {
		//console.log ( ' studio selected: ' + studioSelected );
	}
	var startSelected = false;
	try {
		startSelected = ( Number($( "#startSelection option:selected" ).val()) > 0);
	} 
	finally {
		//console.log ( ' start selected: ' + startSelected );
	}	
	var durationSelected = false;
	try {
		durationSelected = ( Number($( "#durationSelection option:selected" ).val()) > 0);
	}
	finally {
		//console.log ( ' duration selected: ' + durationSelected );
	}
	var songProvided = ($("#songSelection").val().length > 0);
	//console.log ( ' song provided: ' + songProvided );
	if (studioSelected && startSelected && durationSelected && songProvided) {
		$('#addButton').removeAttr("disabled");
	} else {
		$('#addButton').prop("disabled", true);
	}
}

function add_slot(element) {
	// access global variable studios
	var studios = APP.studios;
	// suppress temporary bookings
	deleteBookingArtifacts();
	//alert (' add slot ' + typeof( element ));
	var id = $(element).closest('table').attr('id');
	//console.log ( ' add slot with id = ' + id);
	for (var dayId in weekDays) {
		var weekDay = weekDays[dayId];
		var day = $('#'+weekDays[dayId]).html();
		if ( id.startsWith (weekDay) ) {
			
			//console.log ( ' add slot: on= ' + weekDay + ' the= ' + day);
			$(element).closest('tr').append('<td id="temporaryStudio">');
			var strStudioSelect = ' <fieldset class="small"> <legend>Studio</legend> ';
			strStudioSelect +=  '<select class="select" id="studioSelection" onchange="studioSelectionChanged()">';
			// add empty choice in the first place
			strStudioSelect += ' <option selected></option> ;'
			for (studio in studios) {
				strStudioSelect += ' <option value="' + studios[studio].pk.toString() + '" >' + studios[studio].fields.name + '</option> ';
			}
			strStudioSelect +=  ' </fieldset> ';
			$("#temporaryStudio").append( strStudioSelect );
			
			// add a selection to choose the starting hour
			$(element).closest('tr').append('<td id="temporaryStart">');
			var strStartSelect = ' <fieldset class="small"> <legend>Début</legend> ';
			strStartSelect += '<select class="select" id="startSelection" onchange="startSelectionChanged()">';
			// add empty choice in the first place
			strStartSelect += ' <option selected></option> ;'
			for (var n = 0; n < 60; n++) {
				if (n < 10) {
					strStartSelect += ' <option value="' +  (n).toString() +'">' + 'h0' + (n).toString() + '</option>';
				} else {
					strStartSelect += ' <option value="' +  (n).toString() +'">' + 'h' + (n).toString() + '</option>';
				}
			}
			strStartSelect += ' </fieldset> ';
			$("#temporaryStart").append( strStartSelect );

			// add the selection of the duration in quarters
			$(element).closest('tr').append('<td id="temporaryDuration">');
			var strDuration = ' <fieldset class="small"> <legend>Durée</legend> ';
			strDuration += '<select class="select" id="durationSelection" title="duration" onchange="durationSelectionChanged()"> ';
			// empty selection to force user to select one
			strDuration += ' <option selected></option> ';
			$.each( ['15 minutes', '30 minutes', '45 minutes', '1 heure' ], function(key, value ) {
				strDuration += ' <option value="' + (key+1).toString() +'">' + value + '</option>';
			});
			strDuration += ' </fieldset> ';
			$("#temporaryDuration").append( strDuration );
			
			// add an input to define the song
			$(element).closest('tr').append('<td id="temporarySong">');
			var strSong = ' <fieldset class="small"> <legend>Chanson</legend> ';
			strSong += '<input id="songSelection" class="song" type="text" name="song" title="name of the song" onchange="songChanged()" onKeyUp="songChanged()" >';
			strSong += ' </fieldset> ';
			$("#temporarySong").append(strSong);
			
			// add a button to book
			$(element).closest('tr').append('<td id="temporaryAddButton">');
			$("#temporaryAddButton").append('<button id="addButton" disabled class="select" title="cliquez pour réserver" onclick="addBooking(this)">réservez</button>');

		}
	}
}
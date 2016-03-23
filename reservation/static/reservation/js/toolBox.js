// JavaScript Document
// event manage

String.prototype.toNumber = function () {
	return parseInt( this, 10 );
}

function toggleHelp() {
	
    var element = document.getElementById("helpDiv");
    if (element != undefined) {
        if (element.style.display == "block") {
        	element.style.display = "none";
	    }
	    else {
	    	element.style.display = "block";
	    }
    }
}

function addEvent( emt, evt, fnc, bbl)
{
	//alert (' starting add Event ');
	if( 'attachEvent' in emt) {
		emt.attachEvent( 'on' + evt, fnc); //4 MSIE et test avec in
	}
	else if( 'addEventListener' in emt) {
		emt.addEventListener( evt, fnc, bbl); //4 ECMA ex: MFF et test d'existence non false
	}
}

function getObjInJson( JsonString , element ) {

	//alert (' get Obj in Json ' + typeof(JsonString) );
	if ( typeof (JsonString) != 'string' ) { 
		alert ('JsonString not of type String'); 
		return ;
	}
	var _obj = {};
	var _tab = eval(JsonString);
	//console.log ( ' type of _tab = ' + typeof(_tab) );
	if ( typeof (_tab) == 'object') {
		if ((element >= 0) && (element < _tab.length)) {
			_obj = _tab[element];
			return _obj;
		} else {
			alert ('error element out of bounds !!!');
		}
	}
	return _obj;
}

function stopEvent( event)
{
	//Pour IE
	event.cancelBubble = true;
	event.returnValue = false;

	//Pour les autres
	if( event.stopPropagation)
	{
		event.stopPropagation();
		event.preventDefault();
	}

}
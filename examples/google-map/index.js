var gmap = new google.maps.Map(document.getElementById('gmap'), {
		disableDefaultUI: true,
		keyboardShortcuts: false,
		draggable: false,
		disableDoubleClickZoom: true,
		scrollwheel: false,
		streetViewControl: false
	}),
	initGoogleMap = function (olMapDiv) {
		olMapDiv.parentNode.removeChild(olMapDiv);
		gmap.controls[google.maps.ControlPosition.TOP_LEFT].push(olMapDiv);
	};
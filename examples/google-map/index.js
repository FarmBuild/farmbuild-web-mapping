var gmap = new google.maps.Map(document.getElementById('gmap'), {
		disableDefaultUI: true,
		keyboardShortcuts: false,
		draggable: false,
		disableDoubleClickZoom: true,
		scrollwheel: false,
		streetViewControl: false,
		mapTypeId: google.maps.MapTypeId.SATELLITE
	}),
	countryRestrict = {'country': 'au'},
	initGoogleMap = function (olMapDiv) {
		olMapDiv.parentNode.removeChild(olMapDiv);
		gmap.controls[google.maps.ControlPosition.TOP_LEFT].push(olMapDiv);
		initializeGoogleAddressSearch();
		//gmap.setTilt(45)
	},

	initializeGoogleAddressSearch = function () {
		// Create the autocomplete object and associate it with the UI input control.
		// Restrict the search to the default country, and to place type "cities".
		autocomplete = new google.maps.places.Autocomplete(
			/** @type {HTMLInputElement} */(document.getElementById('locationautocomplete')),
			{
				//types: ['(cities)'],
				componentRestrictions: countryRestrict
			});

		google.maps.event.addListener(autocomplete, 'place_changed', onPlaceChanged);
	},


// When the user selects a city, get the place details for the city and
// zoom the map in on the city.
	onPlaceChanged = function () {
		var place = autocomplete.getPlace(), latLng, center;
		if (!place.geometry) {
			return;
		}

		latLng = place.geometry.location;
		center = ol.proj.transform([latLng.lng(), latLng.lat()], 'EPSG:4326', 'EPSG:3857');
		gmap.setCenter(new google.maps.LatLng(latLng.lat(), latLng.lng()));
		view.setZoom(15);
		view.setCenter(center);

	};
/**
 * @since 0.0.1
 * @copyright 2015 Spatial Vision, Inc. http://spatialvision.com.au
 * @license The MIT License
 * @author Spatial Vision
 * @version 0.1.0
 */

'use strict';

/**
 * webmapping
 * @module webmapping
 */
angular.module('farmbuild.webmapping')
	.factory('googleaddresssearch',
	function (validations,
	          $log) {
		var countryRestrict = {'country': 'au'},

			_init = function (target, sourceProjection, destinationProjection, view) {
				// Create the autocomplete object and associate it with the UI input control.
				// Restrict the search to the default country, and to place type "cities".
				var autocomplete = new google.maps.places.Autocomplete(
					/** @type {HTMLInputElement} */(document.getElementById(target)),
					{
						//types: ['(cities)'],
						componentRestrictions: countryRestrict
					});

				google.maps.event.addListener(autocomplete, 'place_changed', function () {
					_onPlaceChanged(autocomplete, sourceProjection, destinationProjection, view)
				});
			},


		// When the user selects a city, get the place details for the city and
		// zoom the map in on the city.
			_onPlaceChanged = function (autocomplete, sourceProjection, destinationProjection, view) {
				var place = autocomplete.getPlace(), latLng;
				if (!place.geometry) {
					return;
				}

				latLng = place.geometry.location;
				_center(latLng, sourceProjection, destinationProjection, view);
			},

			_transform = function (latLng, sourceProjection, destinationProjection) {
				return ol.proj.transform([latLng.lng(), latLng.lat()], sourceProjection, destinationProjection);
			},

			_center = function (latLng, sourceProjection, destinationProjection, view) {
				var center = _transform(latLng, sourceProjection, destinationProjection);
				view.setCenter(center);
				view.setZoom(15);
			};

		return {
			init: _init
		}
	});
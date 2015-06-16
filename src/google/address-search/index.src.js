/**
 * @since 0.0.1
 * @copyright 2015 Spatial Vision, Inc. http://spatialvision.com.au
 * @license The MIT License
 * @author Spatial Vision
 * @version 0.1.0
 */

'use strict';

/**
 * webmapping/googleAddressSearch singleton
 * @private-module webmapping/googleAddressSearch
 */
angular.module('farmbuild.webmapping')
    .factory('webMappingGoogleAddressSearch',
    function (validations,
              $log) {
        var countryRestrict = {'country': 'au'},
          _isDefined = validations.isDefined;

        /**
         * Initialise google address search with autocomplete
         * @method init
         * @param {!string} targetElementId - Auto complete html element in page
         * @param {function} onPlaceChangedCallback - function to call when a location is selected
         * @private
         * @static
         */
        function _init(targetElementId, onPlaceChangedCallback) {
            if(!_isDefined(google) || !_isDefined(google.maps) || !_isDefined(google.maps.places)){
                $log.error('google.maps.places is not defined, please make sure that you have included google places library in your html page.');
                return;
            }

            if(!_isDefined(targetElementId) || !_isDefined(onPlaceChangedCallback)){
                return;
            }

            // Create the autocomplete object and associate it with the UI input control.
            // Restrict the search to the default country, and to place type "cities".
            var autocomplete = new google.maps.places.Autocomplete(
                /** @type {HTMLInputElement} */(document.getElementById(targetElementId)),
                {
                    componentRestrictions: countryRestrict
                });

            google.maps.event.addListener(autocomplete, 'place_changed', function () {
                _onPlaceChanged(autocomplete, onPlaceChangedCallback)
            });
        };


        /**
         * When the user selects a location, get it and send it to callback function
         * @method init
         * @param {!object} autocomplete - Auto complete object
         * @param {function} onPlaceChangedCallback - function to call when a location is selected
         * @private
         * @static
         */
        function _onPlaceChanged(autocomplete, onPlaceChangedCallback) {
            var place = autocomplete.getPlace(), latLng;
            if (!place.geometry) {
                return;
            }

            latLng = place.geometry.location;
            if(_isDefined(onPlaceChangedCallback) && typeof onPlaceChangedCallback === 'function') {
                onPlaceChangedCallback(latLng);
            }
        };

        return {
            init: _init
        }
    });
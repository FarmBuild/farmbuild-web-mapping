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
    .factory('googlemapslayer',
    function (validations,
              $log) {
        var _projection = 'EPSG:3857';

        function _init(targetElementId) {

            return new google.maps.Map(document.getElementById(targetElementId), {
                disableDefaultUI: true,
                keyboardShortcuts: false,
                draggable: false,
                disableDoubleClickZoom: true,
                scrollwheel: false,
                streetViewControl: false,
                mapTypeId: google.maps.MapTypeId.SATELLITE
            });
        };

        function _getProjection() {
            return _projection;
        };

        return {
            init: _init,
            getProjection: _getProjection
        }
    });
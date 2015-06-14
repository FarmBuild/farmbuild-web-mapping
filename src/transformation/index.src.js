'use strict';

angular.module('farmbuild.webmapping')
    .factory('webMappingTransformation',
    function (validations,
              $log) {
        var _isDefined = validations.isDefined,
            _openLayersDefaultProjection = 'EPSG:4326',
            _googleProjection = 'EPSG:3857';

            function _transformToGoogleLatLng(latLng, destinationProjection) {
            if (!_isDefined(latLng) || !_isDefined(destinationProjection)) {
                return;
            }
            var transformed = ol.proj.transform(latLng, _googleProjection, destinationProjection);
            return new google.maps.LatLng(transformed[1], transformed[0])
        };

        function _transformFromGoogleLatLng(latLng) {
            if (!_isDefined(latLng)) {
                return;
            }
            return ol.proj.transform([latLng.lng(), latLng.lat()], _openLayersDefaultProjection, _googleProjection);
        };

        return {
            fromGoogleLatLng: _transformFromGoogleLatLng,
            toGoogleLatLng: _transformToGoogleLatLng
        }

    });
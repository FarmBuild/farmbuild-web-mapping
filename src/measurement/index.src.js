'use strict';

angular.module('farmbuild.webmapping')
    .factory('webMappingMeasurement',
    function (validations,
              webMappingConverter,
              $log) {
        var _isDefined = validations.isDefined,
            _converter = webMappingConverter;

        function _areas(features) {
            $log.info('calculating area of features ...', features);
            try {
                return turf.area(features) * 0.0001;
            } catch (e) {
                $log.error(e);
            }
        };

        function _area(feature) {
            $log.info('calculating area of polygon ...', feature);
            feature = _converter.featureToGeoJson(feature, 'EPSG:4283', 'EPSG:3857');
            try {
                return turf.area(feature) * 0.0001;
            } catch (e) {
                $log.error(e);
            }
        };

        function _length(feature) {
            $log.info('calculating length of line ...', feature);
            feature = _converter.featureToGeoJson(feature, 'EPSG:4283', 'EPSG:3857');
            try {
                return turf.lineDistance(feature, 'kilometers') * 1000;
            } catch (e) {
                $log.error(e);
            }
        };

        return {
            area: _area,
            areas: _areas,
            length: _length
        }

    });

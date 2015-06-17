'use strict';

/**
 * @since 0.0.1
 * @copyright 2015 State of Victoria.

 * @author State of Victoria
 * @version 1.0.0
 */


angular.module('farmbuild.webmapping')
    .factory('webMappingPaddocks',
    function ($log, validations, paddockTypeDefaults, paddockGroupDefaults) {
        var _isDefined = validations.isDefined;

        function _findByCoordinate(coordinate, vectorLayer) {
            var found;
            if (!_isDefined(coordinate) || !_isDefined(vectorLayer)) {
                return;
            }
            var paddocks = vectorLayer.getSource().getFeaturesAtCoordinate(coordinate);
            if (paddocks && paddocks.length > 0) {
                found = vectorLayer.getSource().getFeaturesAtCoordinate(coordinate)[0];
            }
            $log.info('looking up for a paddock at ', coordinate, found);
            return found;
        }

        return {
            findByCoordinate: _findByCoordinate,
            types: function () {
                return paddockTypeDefaults.types;
            },
            groups: function () {
                return paddockGroupDefaults.groups;
            }
        };

    });

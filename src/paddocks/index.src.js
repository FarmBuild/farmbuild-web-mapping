'use strict';

/**
 * @since 0.0.1
 * @copyright 2015 Spatial Vision, Inc. http://spatialvision.com.au
 * @license The MIT License
 * @author Spatial Vision
 * @version 0.1.0
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

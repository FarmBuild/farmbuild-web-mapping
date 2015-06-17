'use strict';

/**
 * @since 0.0.1
 * @copyright 2015 State of Victoria.
 * @author State of Victoria
 * @version 1.0.0
 */

/**
 * webmapping paddocks
 * @type {object}
 * @namespace webmapping.paddocks
 */
angular.module('farmbuild.webmapping')
    .factory('webMappingPaddocks',
    function ($log, validations, paddockTypeDefaults, paddockGroupDefaults) {
        var _isDefined = validations.isDefined;

        /**
         * finds a paddock based on the coordinate
         * @method findByCoordinate
         * @param {!ol.Coordinate} coordinate openlayers map object
         * @param {!ol.layer.Vector} vectorLayer - paddocks layer
         * @returns {ol.Feature} the first paddock found in that coordinate
         * @memberof webmapping.paddocks
         */
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
            /**
             * Paddock types reference
             * @method types
             * @returns {array} paddock types
             * @memberof webmapping.paddocks
             */
            types: function () {
                return paddockTypeDefaults.types;
            },
            /**
             * Paddock groups reference
             * @method groups
             * @returns {array} paddock groups
             * @memberof webmapping.paddocks
             */
            groups: function () {
                return paddockGroupDefaults.groups;
            }
        };

    });

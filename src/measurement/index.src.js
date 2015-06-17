'use strict';

/**
 * webmapping measurement
 * @type {object}
 * @namespace webmapping.measurement
 */

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

		/**
		 * Calculates are of a feature
		 * @method area
		 * @returns {number} area in hectare
		 * @param {!ol.Feature} feature
		 * @param {!String} dataProjection
		 * @param {!String} featureProjection
		 * @memberof webmapping.measurement
		 */
		function _area(feature, dataProjection, featureProjection) {
			$log.info('calculating area of polygon ...', feature);
			feature = _converter.featureToGeoJson(feature, dataProjection, featureProjection);
			try {
				return turf.area(feature) * 0.0001;
			} catch (e) {
				$log.error(e);
			}
		};

		/**
		 * Calculates length of a line
		 * @method length
		 * @returns {number} length in metre
		 * @param {!ol.Feature} feature
		 * @param {!String} dataProjection
		 * @param {!String} featureProjection
		 * @memberof webmapping.measurement
		 */
		function _length(feature, dataProjection, featureProjection) {
			$log.info('calculating length of line ...', feature);
			feature = _converter.featureToGeoJson(feature, dataProjection, featureProjection);
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

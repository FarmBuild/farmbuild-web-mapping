'use strict';

angular.module('farmbuild.webmapping')
	.factory('webMappingMeasurement',
	function (validations,
	          $log) {
		var _isDefined = validations.isDefined;
		
		function _areas(features) {
			$log.info('calculating area of features ...', features);
			return turf.area(features) * 0.0001;
		};
		
		function _area(feature) {
			$log.info('calculating area of polygon ...', feature);
			return feature.getGeometry().getArea() * 0.0001;
		};
		
		function _length(feature) {
			$log.info('calculating length of line ...', feature);
			return feature.getGeometry().getLength() * 0.0001;
		};

		return {
			area: _area,
			areas: _areas,
			length: _length
		}
		
	});
'use strict';

angular.module('farmbuild.webmapping')
	.factory('webMappingMeasurement',
	function (validations,
	          $log) {
		var _isDefined = validations.isDefined,
			_geoJSONFormat = new ol.format['GeoJSON']();

		function _featuresToGeoJson(olFeatures) {
			if(olFeatures.getArray) {
				return angular.fromJson(_geoJSONFormat.writeFeatures(olFeatures.getArray()));
			}
			return angular.fromJson(_geoJSONFormat.writeFeatures(olFeatures));
		};

		function _area(olFeatures) {
			$log.info('calculating area of features ...', olFeatures);
			var geoJsonFeatures = _featuresToGeoJson(olFeatures);
			return turf.area(geoJsonFeatures) * 0.0001;
		};

		return {
			area: _area
		}

	});
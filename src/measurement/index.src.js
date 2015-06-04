'use strict';

angular.module('farmbuild.webmapping')
	.factory('webMappingMeasurement',
	function (validations,
	          $log) {
		var _isDefined = validations.isDefined,
		_geoJSONFormat = new ol.format['GeoJSON']();

		function _openLayerFeatureToGeoJson(olFeature, dataProjection, featureProjection) {
			if (!_isDefined(olFeature)) {
				return;
			}
			$log.info('Converting openlayer feature to geoJson ...', olFeature);
			return _geoJSONFormat.writeFeatureObject(olFeature, {
					dataProjection: dataProjection,
					featureProjection: featureProjection
				});
		};

		function _areas(features) {
			$log.info('calculating area of features ...', features);
			return turf.area(features) * 0.0001;
		};

		function _area(feature) {
			$log.info('calculating area of polygon ...', feature);
			var feature = _openLayerFeatureToGeoJson(feature, 'EPSG:4283', 'EPSG:3857');
			return turf.area(feature) * 0.0001;
		};

		function _length(feature) {
			$log.info('calculating length of line ...', feature);
			var feature = _openLayerFeatureToGeoJson(feature, 'EPSG:4283', 'EPSG:3857');
			return turf.lineDistance(feature, 'kilometers') * 1000;
		};

		return {
			area: _area,
			areas: _areas,
			length: _length
		}

	});

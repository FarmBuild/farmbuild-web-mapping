'use strict';

angular.module('farmbuild.webmapping')
	.factory('webMappingMeasurement',
	function (validations,
	          $log) {
		var _isDefined = validations.isDefined,
			_geoJSONFormat = new ol.format['GeoJSON']();

		function _featuresToGeoJson(olFeatures, dataProjection, featureProjection) {
			if (olFeatures.getArray) {
				return _geoJSONFormat.writeFeaturesObject(olFeatures.getArray(), {
					dataProjection: dataProjection,
					featureProjection: featureProjection
				});
			}
			return _geoJSONFormat.writeFeatureObject(olFeatures, {
				dataProjection: dataProjection,
				featureProjection: featureProjection
			});
		};

		function _olArea(olFeatures, dataProjection, featureProjection) {
			$log.info('calculating area of features ...', olFeatures);
			var geoJsonFeatures = _featuresToGeoJson(olFeatures, dataProjection, featureProjection);
			return turf.area(geoJsonFeatures) * 0.0001;
		};

		function _area(features) {
			$log.info('calculating area of features ...', features);
			return turf.area(features) * 0.0001;
		};

		return {
			area: _area
		}

	});
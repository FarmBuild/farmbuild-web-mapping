'use strict';

angular.module('farmbuild.webmapping')
	.factory('webMappingTransformations',
	function (validations,
	          $log) {
		var _isDefined = validations.isDefined,
			_geoJSONFormat = new ol.format['GeoJSON']();

			function _featureToGeoJson(olFeature) {
			return angular.fromJson(_geoJSONFormat.writeFeature(olFeature));
		};

		function _featuresToGeoJson(olFeatures) {
			if(olFeatures.getArray) {
				return angular.fromJson(_geoJSONFormat.writeFeatures(olFeatures.getArray()));
			}
			return angular.fromJson(_geoJSONFormat.writeFeatures(olFeatures));
		};

		function _erase(olFeature, olFeatures) {
			var feature = _featureToGeoJson(olFeature);
			try {
				olFeatures.forEach(function (layerFeature) {
					var clipper = _featureToGeoJson(layerFeature);
					feature = turf.erase(feature, clipper);
				});
				return feature;
			} catch (e) {
				$log.error(e);
			}
		};

		function _intersect(olFeature, olFeatures) {
			var feature = _featureToGeoJson(olFeature);
			try {
				olFeatures.forEach(function (layerFeature) {
					var clipper = _featureToGeoJson(layerFeature);
					feature = turf.intersect(feature, clipper);
				});
				return feature;
			} catch (e) {
				$log.error(e);
			}
		};

		function _merge(olFeatures) {
			$log.info('merging features ...', olFeatures);
			var toMerge;
			toMerge = _featuresToGeoJson(olFeatures);
			try {
				return turf.merge(toMerge);
			} catch (e) {
				$log.error(e);
			}

		};

		return {
			erase: _erase,
			intersect: _intersect,
			merge: _merge
		}

	});
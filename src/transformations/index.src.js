'use strict';

angular.module('farmbuild.webmapping')
	.factory('webMappingTransformations',
	function (validations,
	          $log) {
		var _isDefined = validations.isDefined,
			_geoJSONFormat = new ol.format['GeoJSON']();

			function _openLayerFeatureToGeoJson(olFeature) {
			return _geoJSONFormat.writeFeatureObject(olFeature);
		};

		function _openLayerFeaturesToGeoJson(olFeatures) {
			if(olFeatures.getArray) {
				return _geoJSONFormat.writeFeaturesObject(olFeatures.getArray());
			}
			return _geoJSONFormat.writeFeaturesObject(olFeatures);
		};

		function _geoJsonToOpenLayerFeature(feature, properties) {
			if (!_isDefined(feature)) {
				return;
			}
			$log.info('Converting geoJson to openlayer feature ...', feature);
			properties.geometry = new ol.geom[feature.geometry.type](feature.geometry.coordinates);
			return new ol.Feature(properties);
		};

		function _erase(olFeature, olFeatures) {
			$log.info('erasing feature', olFeature);
			var feature = _openLayerFeatureToGeoJson(olFeature),
				properties = olFeature.getProperties();
			try {
				if(olFeatures.forEach){
					olFeatures.forEach(function (layerFeature) {
						var clipper = _openLayerFeatureToGeoJson(layerFeature);
						feature = turf.erase(feature, clipper);
					});
				} else {
					var clipper = _openLayerFeatureToGeoJson(olFeatures);
					feature = turf.erase(feature, clipper);
				}

				return _geoJsonToOpenLayerFeature(feature, properties);
			} catch (e) {
				$log.error(e);
			}
		};

		function _intersect(olFeature, olFeatures) {
			$log.info('intersecting feature', olFeatures);
			var feature = _openLayerFeatureToGeoJson(olFeature),
				properties = olFeature.getProperties();
			try {
				olFeatures.forEach(function (layerFeature) {
					var clipper = _openLayerFeatureToGeoJson(layerFeature);
					feature = turf.intersect(feature, clipper);
				});
				return _geoJsonToOpenLayerFeature(feature, properties);
			} catch (e) {
				$log.error(e);
			}
		};

		function _merge(olFeatures) {
			$log.info('merging features ...', olFeatures);
			var properties, toMerge;
			toMerge = _openLayerFeaturesToGeoJson(olFeatures);
			properties = {name: 'merged ' + (new Date()).getTime()};
			try {
				return _geoJsonToOpenLayerFeature(turf.merge(toMerge), properties);
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
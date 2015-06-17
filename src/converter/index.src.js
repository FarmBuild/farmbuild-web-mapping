/**
 * @since 0.0.1
 * @copyright 2015 State of Victoria.

 * @author State of Victoria
 * @version 1.0.0
 */

'use strict';

/**
 * webmapping/converter singleton
 * @private-module webmapping/converter
 */

angular.module('farmbuild.webmapping')
	.factory('webMappingConverter',
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

        function _openLayerFeaturesToGeoJson(olFeatures, dataProjection, featureProjection) {
            if (!_isDefined(olFeatures)) {
                return;
            }
            $log.info('Converting openlayer feature to geoJson ...', olFeatures);
            return _geoJSONFormat.writeFeaturesObject(olFeatures, {
                dataProjection: dataProjection,
                featureProjection: featureProjection
            });
        };

        function _geoJsonToOpenLayerFeature(feature, dataProjection, featureProjection) {
            if (!_isDefined(feature)) {
                return;
            }
            $log.info('Converting geoJson feature to openlayer feature ...', feature);
            return _geoJSONFormat.readFeature(feature, {
                dataProjection: dataProjection,
                featureProjection: featureProjection
            });
        };

        function _geoJsonToOpenLayerFeatures(features, dataProjection, featureProjection) {
            if (!_isDefined(features)) {
                return;
            }
            $log.info('Converting geoJson feature to openlayer features ...', features);
            return _geoJSONFormat.readFeatures(features, {
                dataProjection: dataProjection,
                featureProjection: featureProjection
            });
        };

		return {
            featureToGeoJson: _openLayerFeatureToGeoJson,
            featuresToGeoJson: _openLayerFeaturesToGeoJson,
            geoJsonToFeature: _geoJsonToOpenLayerFeature,
            geoJsonToFeatures: _geoJsonToOpenLayerFeatures
		}

	});

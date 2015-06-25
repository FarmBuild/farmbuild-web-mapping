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
		_geoJSONFormat = new ol.format['GeoJSON'](),
      _dataProjection = 'EPSG:4326',
      _featureProjection = 'EPSG:3857';


        function _openLayerFeatureToGeoJson(olFeature) {
            if (!_isDefined(olFeature)) {
                return;
            }
            $log.info('Converting openlayer feature to geoJson ...', olFeature);
            return _geoJSONFormat.writeFeatureObject(olFeature, {
                dataProjection: _dataProjection,
                featureProjection: _featureProjection
            });
        };

        function _openLayerFeaturesToGeoJson(olFeatures) {
            if (!_isDefined(olFeatures)) {
                return;
            }
            $log.info('Converting openlayer feature to geoJson ...', olFeatures);
            return _geoJSONFormat.writeFeaturesObject(olFeatures, {
                dataProjection: _dataProjection,
                featureProjection: _featureProjection
            });
        };

        function _geoJsonToOpenLayerFeature(feature) {
            if (!_isDefined(feature)) {
                return;
            }
            $log.info('Converting geoJson feature to openlayer feature ...', feature);
            return _geoJSONFormat.readFeature(feature, {
                dataProjection: _dataProjection,
                featureProjection: _featureProjection
            });
        };

        function _geoJsonToOpenLayerFeatures(features) {
            if (!_isDefined(features)) {
                return;
            }
            $log.info('Converting geoJson feature to openlayer features ...', features);
            return _geoJSONFormat.readFeatures(features, {
                dataProjection: _dataProjection,
                featureProjection: _featureProjection
            });
        };

		return {
            featureToGeoJson: _openLayerFeatureToGeoJson,
            featuresToGeoJson: _openLayerFeaturesToGeoJson,
            geoJsonToFeature: _geoJsonToOpenLayerFeature,
            geoJsonToFeatures: _geoJsonToOpenLayerFeatures
		}

	});

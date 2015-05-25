/**
 * @since 0.0.1
 * @copyright 2015 Spatial Vision, Inc. http://spatialvision.com.au
 * @license The MIT License
 * @author Spatial Vision
 * @version 0.1.0
 */

'use strict';

/**
 * webmappingConverter
 * @module webmappingConverter
 */
angular.module('farmbuild.webmapping')
  .factory('webmappingConverter',
  function (farmdata,
            validations,
            $log,
            webMappingSession) {
    var _isDefined = validations.isDefined,
      webmappingConverter = {};

    function createFeatureCollection(geometry) {

    }


    function createFeature(geometry) {
      return {
        "type": "Feature",
        "geometry": angular.copy(geometry),
        "properties": {}
      };
    }

    function toGeoJsons(farmData) {
      $log.info("Extracting farm and paddocks geometry from farmData ...");
      var farm = farmData.geometry,
        paddocks = [];

      if (!_isDefined(farmData.geometry) || !_isDefined(farmData.paddocks)) {
        return undefined;
      }

      angular.forEach(farmData.paddocks, function (val) {
        paddocks.push(createFeature(val.geometry));
      });

      return {
        farm: {
          "type": "FeatureCollection",
          "features": [createFeature(farm)]
        },
        paddocks: {
          "type": "FeatureCollection",
          "features": paddocks
        }
      }
    };
    webmappingConverter.toGeoJsons = toGeoJsons;

    function toFarmData(farmData, geoJsons) {

      $log.info("Converting geoJsons.farm.features[0] and paddocks geojson to farmData ...");
      var farmFeature = geoJsons.farm.features[0],
        paddocks = geoJsons.paddocks;
      farmData.geometry = farmFeature.geometry;

      paddocks.features.forEach(function (paddockFeature, i) {
        farmData.paddocks[i].geometry = (paddockFeature.geometry);
      });

      return farmData;
    };
    webmappingConverter.toFarmData = toFarmData;



    return webmappingConverter;

  });
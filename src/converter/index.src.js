/**
 * @since 0.0.1
 * @copyright 2015 Spatial Vision, Inc. http://spatialvision.com.au
 * @license The MIT License
 * @author Spatial Vision
 * @version 0.1.0
 */

'use strict';

angular.module('farmbuild.webmapping')
  .factory('webmappingConverter',
  function (farmdata,
            validations,
            $log,
            webmappingValidator,
            webMappingSession) {
    var _isDefined = validations.isDefined,
      webmappingConverter = {},
      validator = webmappingValidator;

    function createFeatureCollection(geometry) {

    }

    function convertCrs(geometry, crs) {
      geometry.crs = {"type": "name", "properties": {"name": crs}};
      return geometry;
    }

    function resetCrs(geometry) {
      geometry.crs = geometry.crs.properties.name;
      return geometry;
    }

    function createFeature(geometry, crs, name) {
      return {
        "type": "Feature",
        "geometry": angular.copy(convertCrs(geometry, crs)),
        "properties": {name:name}
      };
    }


    function toGeoJsons(farmData) {
      $log.info("Extracting farm and paddocks geometry from farmData ...");
      var copied = angular.copy(farmData)

      if (!validator.validate(copied)) {
        return undefined;
      }

      var farm = copied.geometry,
        paddocks = [];

      copied.paddocks.forEach(function (paddock) {
        paddocks.push(createFeature(paddock.geometry, farm.crs, paddock.name));
      });

      return {
        farm: {
          "type": "FeatureCollection",
          "features": [createFeature(farm, farm.crs, copied.name)]
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
      farmData.geometry = resetCrs(farmFeature.geometry);
      //farmData.area =

      paddocks.features.forEach(function (paddockFeature, i) {
        farmData.paddocks[i].geometry = paddockFeature.geometry;
        delete farmData.paddocks[i].geometry.crs;
      });

      return farmData;
    };
    webmappingConverter.toFarmData = toFarmData;



    return webmappingConverter;

  });
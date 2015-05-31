/**
 * @since 0.0.1
 * @copyright 2015 Spatial Vision, Inc. http://spatialvision.com.au
 * @license The MIT License
 * @author Spatial Vision
 * @version 0.1.0
 */

'use strict';

angular.module('farmbuild.webmapping')
  .factory('webMappingSession',
  function ($log, farmdata, validations, webMappingMeasurement) {

    var webMappingSession = {},
      _isDefined = validations.isDefined;


    function load(farmData) {
      var loaded = farmdata.load(farmData);

      if (!_isDefined(loaded)) {
        return undefined;
      }

      return farmData;
    };
    webMappingSession.load = load;

    function save(farmData, geoJsons) {
      if(!_isDefined(farmData)) {
        $log.error('Unable to save the undefined farmData!');
        return undefined;
      }
      farmData.area = webMappingMeasurement.areas(geoJsons.farm);
      farmData.name = geoJsons.farm.features[0].properties.name;
      return farmdata.update(farmData);
    }

    webMappingSession.save = save;

    webMappingSession.clear = farmdata.session.clear;

    webMappingSession.isLoadFlagSet = farmdata.session.isLoadFlagSet;

    webMappingSession.find = function() {
      return farmdata.session.find();
    }

    webMappingSession.export = function(document, farmData, geoJsons) {
      return farmdata.session.export(document, save(farmData, geoJsons));
    }

    return webMappingSession;

  });

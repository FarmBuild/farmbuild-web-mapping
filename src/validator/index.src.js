//http://www.biology-online.org/dictionary/Nutrient_medium
/**
 * nutrientMedium
 * @since 0.0.1
 * @copyright 2015 Spatial Vision, Inc. http://spatialvision.com.au
 * @license The MIT License
 * @author Spatial Vision
 * @version 0.1.0
 */

'use strict';

/**
 * webmapping/webmappingValidator singleton
 * @private-module webmapping/webmappingValidator
 */
angular.module('farmbuild.webmapping')
  .factory('webmappingValidator',
  function (validations,
            farmdata,
            $log) {
    var webmappingValidator = {geojsonhint:geojsonhint},
      _isDefined = validations.isDefined,
      _isArray = validations.isArray,
      _isPositiveNumber = validations.isPositiveNumber,
      _isEmpty = validations.isEmpty;

    if(!_isDefined(geojsonhint)) {
      throw Error('geojsonhint must be available!')
    }

    function isGeoJsons(geoJsons) {
      var errors =  geojsonhint.hint((typeof geoJsons === 'string'?geoJsons:angular.toJson(geoJsons))),
        isGeoJson = errors.length === 0;
      if(!isGeoJson) {
        $log.error('isGeoJsons errors: ', errors)
      }
      return isGeoJson;
    }

    webmappingValidator.isGeoJsons = isGeoJsons;

    function _validate(farmData) {
      $log.info('validating farmData...', farmData);

      if(!farmdata.validate(farmData)) {
        return false;
      }


      if (!_isDefined(farmData) ||
          !_isDefined(farmData.geometry) ||
          !_isDefined(farmData.geometry.crs) ||
          !_isDefined(farmData.paddocks)) {
        $log.error('farmData must have geometry, geometry.crs, paddocks');
        return false;
      }

      return true;
    };

    webmappingValidator.validate = _validate;


    return webmappingValidator;
  });
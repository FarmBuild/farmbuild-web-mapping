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
    var webmappingValidator = {},
      _isDefined = validations.isDefined,
      _isArray = validations.isArray,
      _isPositiveNumber = validations.isPositiveNumber,
      _isEmpty = validations.isEmpty;

    if(!_isDefined(geojsonhint)) {
      throw Error('geojsonhint must be available!')
    }

    function isGeoJsons(geoJson) {
      return geojsonhint.hint(geoJson).length === 0;
    }

    webmappingValidator.isGeoJsons = isGeoJsons;

    function _validate(farmData) {
      $log.info('validating farmData...', farmData);

      if(!farmdata.validate(farmData)) {
        return false;
      }

      if (!_isDefined(farmData) ||
          !_isDefined(farmData.geometry) ||
          !_isDefined(farmData.paddocks)) {
        $log.error('invalid, must have geometry and paddocks: %j', farmData);
        return false;
      }

      return true;
    };

    webmappingValidator.validate = _validate;


    return webmappingValidator;
  });
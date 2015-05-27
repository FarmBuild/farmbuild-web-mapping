'use strict';
///**
// * @since 0.0.1
// * @copyright 2015 Spatial Vision, Inc. http://spatialvision.com.au
// * @license The MIT License
// * @author Spatial Vision
// * @version 0.1.0
// */
//

angular.module('farmbuild.webmapping')
  .factory('webMappingProjections',
  function ($log, farmdata) {
    var webMappingProjections = {supported:farmbuild.farmdata.crsSupported}
    farmbuild.farmdata.crsSupported.forEach(function(crs) {
      proj4.defs(crs.name, crs.projection);
    });
    return webMappingProjections;
  });

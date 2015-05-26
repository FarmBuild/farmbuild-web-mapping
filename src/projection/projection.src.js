'use strict';
///**
// * @since 0.0.1
// * @copyright 2015 Spatial Vision, Inc. http://spatialvision.com.au
// * @license The MIT License
// * @author Spatial Vision
// * @version 0.1.0
// */
//
//'use strict';
//
//angular.module('farmbuild.webmapping')
//  .factory('webMappingProjections',
//  function ($log, farmdata) {
//    var webMappingProjections = {supported:[]}
//    //proj4.defs("EPSG:4283", "+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs");
//    return webMappingProjections;
//
//  });

farmbuild.farmdata.crsSupported.forEach(function(crs) {
  proj4.defs(crs.name, crs.projection);
})

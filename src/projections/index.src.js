'use strict';
angular.module('farmbuild.webmapping')
    .factory('webMappingProjections',
    function ($log, farmdata) {
        var webMappingProjections = {supported: farmbuild.farmdata.crsSupported}
        farmdata.crsSupported.forEach(function (crs) {
            proj4.defs(crs.name, crs.projection);
        });
        return webMappingProjections;
    });

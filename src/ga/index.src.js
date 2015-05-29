/**
 * @since 0.0.1
 * @copyright 2015 Spatial Vision, Inc. http://spatialvision.com.au
 * @license The MIT License
 * @author Spatial Vision
 * @version 0.1.0
 */

'use strict';

/**
 * webMapping/webMappingGoogleAnalytics singleton
 * @private-module webMapping/webMappingGoogleAnalytics
 */
angular.module('farmbuild.webmapping')
    .factory('webMappingGoogleAnalytics',
    function ($log, validations, googleAnalytics) {

        var webMappingGoogleAnalytics = {}, api = 'farmbuild-webmapping',
            _isDefined = validations.isDefined;

        webMappingGoogleAnalytics.trackWebMapping = function(clientName) {
            $log.info('googleAnalyticsWebMapping.trackCalculate clientName: %s', clientName);
            googleAnalytics.track(api, clientName)
        }



        return webMappingGoogleAnalytics;

    });

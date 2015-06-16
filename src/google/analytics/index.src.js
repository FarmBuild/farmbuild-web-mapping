/**
 * @since 0.0.1
 * @copyright 2015 Spatial Vision, Inc. http://spatialvision.com.au
 * @license The MIT License
 * @author Spatial Vision
 * @version 0.1.0
 */

'use strict';

/**
 * webmapping/ga singleton
 * @module webmapping/ga
 */
angular.module('farmbuild.webmapping')
	.factory('webMappingGoogleAnalytics',
	function ($log, validations, googleAnalytics) {

		var api = 'farmbuild-webmapping',
			_isDefined = validations.isDefined;

		/**
		 * Sends api usage statistic to google analytics
		 * @method trackWebMapping
		 * @param {!string} clientName
		 * @public
		 * @static
		 */
		 function _trackWebMapping(clientName) {
			if (!_isDefined(clientName)) {
				$log.error('client name is not specified');
				return;
			}

			$log.info('googleAnalyticsWebMapping.trackWebMapping clientName: %s', clientName);
			googleAnalytics.track(api, clientName)
		}

		return {
			trackWebMapping: _trackWebMapping
		};

	});

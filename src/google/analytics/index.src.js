/**
 * @since 0.0.1
 * @copyright 2015 State of Victoria.

 * @author State of Victoria
 * @version 1.0.0
 */

'use strict';

/**
 * webmapping ga
 * @type {object}
 * @namespace webmapping.ga
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
		 * @memberof webmapping.ga
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

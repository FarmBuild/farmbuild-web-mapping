/**
 * @since 0.0.1
 * @copyright 2015 Spatial Vision, Inc. http://spatialvision.com.au
 * @license The MIT License
 * @author Spatial Vision
 * @version 0.1.0
 */

'use strict';

/**
 * webMapping
 * @module webMapping
 */
angular.module('farmbuild.webMapping', ['farmbuild.core', 'farmbuild.farmdata'])
	.factory('webMapping',
	function (farmdata,
	          validations,
	          $log, $http) {
		var _isPositiveNumber = validations.isPositiveNumber,
			_isDefined = validations.isDefined,
			webMapping = {};

		function _extractGeometry(farmData) {
			console.log(farmData.data.features);
			var features = [];
			//angular.forEach(farmData.data, function(){
			//
			//});

			return angular.toJson({
				"type": "FeatureCollection",
				"features": farmData.data.features
			})
		};

		$log.info('Welcome to Web Mapping... ' +
		'this should only be initialised once! why we see twice in the example?');

		/**
		 * Validate farmData block
		 * @method load
		 * @param {!object} url
		 * @returns {object} farmData
		 * @public
		 * @static
		 */
		webMapping.load = function (url) {
			$http.get(url).then(function (resp) {
				_load(resp);
			});

			function _load(toLoad) {
				//if (!farmdata.isFarmData(toLoad)) {
				//	return undefined;
				//}
				_extractGeometry(toLoad);
			}
		};

		// Provide a shortcut for modules
		webMapping.version = '0.1.0';

		if (typeof window.farmbuild === 'undefined') {
			window.farmbuild = {
				webmapping: webMapping
			};
		} else {
			window.farmbuild.webmapping = webMapping;
		}

		return webMapping;
	});
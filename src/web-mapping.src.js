/**
 * @since 0.0.1
 * @copyright 2015 Spatial Vision, Inc. http://spatialvision.com.au
 * @license The MIT License
 * @author Spatial Vision
 * @version 0.1.0
 */

'use strict';

/**
 * webmapping
 * @module webmapping
 */
angular.module('farmbuild.webmapping', ['farmbuild.core', 'farmbuild.farmdata'])
	.factory('webmapping',
	function (farmdata,
	          validations,
	          $log,
	          webMappingSession) {
		var _isDefined = validations.isDefined,
			webmapping;

		function _fromFarmData(farmData) {
			$log.info("Extracting farm and paddocks geometry from farmData ...");
			var farm = farmData.geometry,
				paddocks = [];

			if (!_isDefined(farmData.geometry) || !_isDefined(farmData.paddocks)) {
				return undefined;
			}

			angular.forEach(farmData.paddocks, function (val) {
				paddocks.push(
					{
						"type": "Feature",
						"geometry": val.geometry
					});
			});

			return {
				farm: {
					"type": "FeatureCollection",
					"features": [
						{
							"type": "Feature",
							"geometry": farm
						}]
				},
				paddocks: {
					"type": "FeatureCollection",
					"features": paddocks
				}
			}
		};

		function _toFarmData(farmGeometry) {
			$log.info("Writing farm and paddocks geometry to farmData ...");
			var farm = data.geometry,
				paddocks = [];

			angular.forEach(data.paddocks, function (val) {
				paddocks.push(val.geometry);
			});

			return farmGeometry;
		};

		$log.info('Welcome to Web Mapping... ' +
		'this should only be initialised once! why we see twice in the example?');

		function createDefault(farmData) {
			return _fromFarmData(farmData);
		}

		/**
		 * Validate farmData block
		 * @method load
		 * @returns {object} farmData
		 * @public
		 * @static
		 */
		function _load(farmData) {
			var loaded = farmdata.load(farmData);
			if (!_isDefined(loaded)) {
				return undefined;
			}

			if (!loaded.hasOwnProperty('webMapping')) {
				loaded.webMapping = createDefault(farmData);
				loaded = farmdata.update(loaded);
			}

			return loaded;
		};


		function _exportFarmData(toExport) {
			if (!toExport) {
				return undefined;
			}
			return _toFarmData(toExport);
		};

		webmapping = {
			exportFarmData: _exportFarmData,
			load: _load
		};

		// Provide a shortcut for modules
		webmapping.version = '0.1.0';

		if (typeof window.farmbuild === 'undefined') {
			window.farmbuild = {
				webmapping: webmapping
			};
		} else {
			window.farmbuild.webmapping = webmapping;
		}

		return webmapping;

	});
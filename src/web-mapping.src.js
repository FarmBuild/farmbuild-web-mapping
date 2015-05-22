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
            webmappingValidator,
            webmappingConverter,
	          webMappingSession) {
		var _isDefined = validations.isDefined,
			webmapping = {session:webMappingSession, farmdata: farmdata,
      validate:webmappingValidator.validate};

		$log.info('Welcome to Web Mapping... ' +
		'this should only be initialised once! why we see twice in the example?');

    /**
     * Finds the farmData from the session.
     * @method find
     * @returns {object} the farmData stored in session, undefined if the farmData is found in session
     * @public
     * @static
     */
    webmapping.find = function () {
      return webMappingSession.find();
    }

		function createDefault(farmData) {
			return webmappingConverter.toGeoJson(farmData);
		}

		/**
		 * Validate farmData block
		 * @method load
		 * @returns {object} geoJsons containing the feature collection,
     * geoJsons.farm: represents the farm
     * geoJsonspaddocks: represents the paddocks
		 * @public
		 * @static
		 */
		function _load(farmData) {
			var loaded = farmdata.load(farmData);

			if (!_isDefined(loaded)) {
				return undefined;
			}

			return createDefault(farmData);
		};
    webmapping.load = _load;

		function _exportFarmData(toExport) {
			if (!toExport) {
				return undefined;
			}
			return _toFarmData(toExport);
		};

		webmapping.exportFarmData = _exportFarmData;

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
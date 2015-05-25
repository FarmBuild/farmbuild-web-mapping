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
    $log.info('Welcome to Web Mapping...');

    var _isDefined = validations.isDefined,
      session = webMappingSession,
			webmapping = {
        session:session,
        farmdata: farmdata,
        validator:webmappingValidator,
        toGeoJsons:webmappingConverter.toGeoJsons,
        /**
         * Loads the specified farmData into session
         * @method load
         * @returns {object} the farmData stored in session
         * geoJsons.farm: represents the farm
         * geoJsonspaddocks: represents the paddocks
         * @public
         * @static
         */
        load: session.load,
        /**
         * Finds the farmData from the session.
         * @method find
         * @returns {object} the farmData stored in session, undefined if the farmData is found in session
         * @public
         * @static
         */
        find: session.find,
        /**
         * Saves the specified geoJson into the farmData in the session.
         * @method save
         * @returns {object} the farmData stored in session, undefined if the farmData is found in session
         * @public
         * @static
         */
        save: function(geoJsons) {
          var farmData = session.find();
          return session.save(webmappingConverter.toFarmData(farmData, geoJsons));
        }};

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
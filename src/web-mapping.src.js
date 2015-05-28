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
            geoJsonValidator,
            farmdataConverter,
	          webMappingSession,
	          webMappingProjections,
						webMappingInteractions,
	          webMappingPaddocks,
	          webMappingOpenLayersHelper,
	          webMappingGoogleAddressSearch) {
    $log.info('Welcome to Web Mapping...');

    var _isDefined = validations.isDefined,
      session = webMappingSession,
			webMapping = {
        session:session,
        farmdata: farmdata,
        validator:geoJsonValidator,
        toGeoJsons:farmdataConverter.toGeoJsons,
				actions: webMappingInteractions,
				paddocks:  webMappingPaddocks,
				olHelper: webMappingOpenLayersHelper,
				googleAddressSearch: webMappingGoogleAddressSearch,
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
          return session.save(farmData, geoJsons);
        },
        /**
         * Saves and exports the farmData.json with a file name: farmdata-NAME_OF_FILE-yyyyMMddHHmmss.json
         * It creates <a> element with 'download' attribute, the data is attached to href
         * and invoke click() function so the user gets the file save dialogue or something equivalent.
         * @method export
         * @param {object} document
         * @param {object} farmData
         */
        export: session.export,
        /**
         * Creates a new farmdata block as Javascript object with the specified name.
         * @method create
         * @param {!string} name - The name of the farm
         * @param {string} id - The ID of this farm in case if you manage this farm in an external system, so you can map the farmData
         * with the external system
         * @returns {Object} the farmdata object, undefined if the required fields are not provided
         * @public
         * @static
         */
        create: farmdata.create
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
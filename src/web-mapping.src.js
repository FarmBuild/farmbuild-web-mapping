/**
 * @since 0.0.1
 * @copyright 2015 State of Victoria.

 * @author State of Victoria
 * @version 1.0.0
 */

'use strict';

/**
 * webmapping
 * @type {object}
 * @namespace webmapping
 */
angular.module('farmbuild.webmapping', ['farmbuild.core', 'farmbuild.farmdata'])
	.factory('webmapping',
	function (farmdata,
	          validations,
	          $log,
              $rootScope,
	          geoJsonValidator,
	          farmdataConverter,
	          webMappingSession,
	          webMappingProjections,
	          webMappingInteractions,
	          webMappingMeasurement,
	          webMappingPaddocks,
	          webMappingOpenLayersHelper,
	          webMappingGoogleAddressSearch,
	          webMappingGoogleAnalytics,
	          webMappingParcels) {
		$log.info('Welcome to Web Mapping...');

		var _isDefined = validations.isDefined,
			session = webMappingSession,
			webMapping = {
				session: session,
				farmdata: farmdata,
				validator: geoJsonValidator,
				toGeoJsons: farmdataConverter.toGeoJsons,

				/**
				 * converts farmData geometry to KML
				 * @method toKml
				 * @param {object} farmData - farmData to convert
				 * @returns {string} KML string
				 * @memberof webmapping
				 */
				toKml: farmdataConverter.toKml,

				/**
				 * converts farmData geometry to geoJSON
				 * @method toGeoJson
				 * @param {object} farmData - farmData to convert
				 * @returns {object} geoJSON object
				 * @memberof webmapping
				 */
				toGeoJson: farmdataConverter.toGeoJson,

				/**
				 * converts farmData geometry to geoJSON and exports the file
				 * @method exportGeoJson
				 * @param {object} farmData - farmData to convert
				 * @memberof webmapping
				 */
				exportGeoJson: farmdataConverter.exportGeoJson,

				/**
				 * converts farmData geometry to KML and exports the file
				 * @method exportKml
				 * @param {object} farmData - farmData to convert
				 * @memberof webmapping
				 */
				exportKml: farmdataConverter.exportKml,
				actions: webMappingInteractions,
				paddocks: webMappingPaddocks,
				olHelper: webMappingOpenLayersHelper,
				ga: webMappingGoogleAnalytics,
				parcels: webMappingParcels,
				measurement: webMappingMeasurement,

				/**
				 * Loads the specified farmData into session
				 * @method load
				 * @returns {object} the farmData stored in session
				 * geoJsons.farm: represents the farm
				 * geoJsonspaddocks: represents the paddocks
				 * @memberof webmapping
				 */
				load: session.load,

				/**
				 * Finds the farmData from the session.
				 * @method find
				 * @returns {object} the farmData stored in session, undefined if the farmData is found in session
				 * @memberof webmapping
				 */
				find: session.find,

				/**
				 * Saves the specified geoJson into the farmData in the session.
				 * @method save
				 * @returns {object} the farmData stored in session, undefined if the farmData is found in session
				 * @memberof webmapping
				 */
				save: function (geoJsons) {
					var farmData = session.find();
					return session.save(farmData, geoJsons);
				},

				/**
				 * Saves and exports the farmData.json with a file name: farmdata-NAME_OF_FILE-yyyyMMddHHmmss.json
				 * It creates HTML link element with 'download' attribute, the data is attached to href
				 * and invoke click() function so the user gets the file save dialogue or something equivalent.
				 * @method export
				 * @param {object} document - browser document object reference
				 * @param {object} farmData - farmData to export
				 * @memberof webmapping
				 */
				export: session.export,
				/**
				 * Creates a new farmdata block as Javascript object with the specified name.
				 * @method create
				 * @param {!string} name - The name of the farm
				 * @param {string} id - The ID of this farm in case if you manage this farm in an external system, so you can map the farmData
				 * with the external system
				 * @returns {Object} the farmdata object, undefined if the required fields are not provided
				 * @memberof webmapping
				 */
				create: farmdata.create,

        /**
         * Listens on events of a given type.
         * @method on
         * @param {!string} name Event name to listen on.
         * @param {!function(event, ...args)} listener - Function to call when the event is emitted.
         * @returns {function()} Returns a deregistration function for this listener.
         * @memberof webmapping
         */
        on: function(name, listener){
          return $rootScope.$on(name, listener);
        },

				update: session.update
			};

		// Provide a shortcut for modules
		webMapping.version = '1.0.0';

		if (typeof window.farmbuild === 'undefined') {
			window.farmbuild = {
				webmapping: webMapping
			};
		} else {
			window.farmbuild.webmapping = webMapping;
		}

		return webMapping;

	});

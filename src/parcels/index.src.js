'use strict';

/**
 * @since 0.0.1
 * @copyright 2015 State of Victoria.
 * @author State of Victoria
 * @version 1.0.0
 */

/**
 * webmapping rural parcels
 * @type {object}
 * @namespace webmapping.parcels
 */
angular.module('farmbuild.webmapping')
	.factory('webMappingParcels',
	function ($log, $http, validations, webMappingInteractions, webMappingConverter) {
		var _isDefined = validations.isDefined,
			converter = webMappingConverter;

		/**
		 * loads rural parcels and add it as layer to ol.Map.
		 * This method uses JsonP to get information, make sure the projection definition matches your extent data, otherwise you will not get any data.
		 * @method load
		 * @param {!String} serviceUrl url of wfs parcels service to get data from
		 * @param {!ol.Extent} extent extent of area to query for parcels
		 * @param {!String} extentDataProjection data projection of extent data
		 * @param {!String} responseProjection desired data projection of the response
		 * @returns {!object} a promise object that represents http request made to get parcels
		 * @memberof webmapping.parcels
		 */
		function _load(serviceUrl, extent, extentDataProjection, responseProjection) {
			//load('http://sv079.sv.domain:8080/geoserver/farmbuild/ows', [16204823.698695935, -4332241.187057228, 16206541.143175218, -4331412.32303176], 'EPSG:3857', 'EPSG:3857');
			var config = {
				params: {
					service: 'WFS',
					version: '1.0.0',
					request: 'GetFeature',
					typeName: 'farmbuild:parcels',
					outputFormat: 'text/javascript',
					format_options: 'callback:JSON_CALLBACK',
					srsname: responseProjection,
					bbox: extent.join(',') + ',' + extentDataProjection
				}
			};

			if (!_isDefined(serviceUrl) || !_isDefined(extent) || !_isDefined(extentDataProjection) || !_isDefined(responseProjection)) {
				$log.error('There is a problem with input parameters, please refer to api for more information');
				return;
			}
			$log.info('Loading parcels information for the extent: ', extent);
			return $http({method: 'JSONP', url: serviceUrl, params: config.params}).
				success(function (data, status) {
					$log.info('loaded parcels successfully.', status, data);
					var olFeatures = converter.geoJsonToFeatures({
						"type": "FeatureCollection",
						"features": data.features
					});
					webMappingInteractions.parcels.snap(olFeatures);
				})
				.error(function (data, status) {
					$log.error('loading parcels failed!!', status, data);
				});
		}

		return {
			load: _load
		};

	});

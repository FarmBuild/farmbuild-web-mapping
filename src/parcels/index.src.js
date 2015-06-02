'use strict';

/**
 * @since 0.0.1
 * @copyright 2015 Spatial Vision, Inc. http://spatialvision.com.au
 * @license The MIT License
 * @author Spatial Vision
 * @version 0.1.0
 */


angular.module('farmbuild.webmapping')
	.factory('webMappingParcels',
	function ($log, $http, validations, webMappingInteractions, webMappingOpenLayersHelper) {
		var _isDefined = validations.isDefined, olHelper = webMappingOpenLayersHelper;

		function _load(serviceUrl, extent, dataProjection, resultProjection) {
			//load('http://sv079.sv.domain:8080/geoserver/farmbuild/ows', [16204823.698695935, -4332241.187057228, 16206541.143175218, -4331412.32303176], 'EPSG:3857', 'EPSG:3857');
			var config = {
				params: {
					service: 'WFS',
					version: '1.0.0',
					request: 'GetFeature',
					typeName: 'farmbuild:parcels',
					outputFormat: 'text/javascript',
					format_options: 'callback:JSON_CALLBACK',
					srsname: resultProjection,
					bbox: extent.join(',') + ',' + dataProjection
				}
			};

			if (!_isDefined(serviceUrl) || !_isDefined(extent) || !_isDefined(dataProjection) || !_isDefined(resultProjection)) {
				return;
			}
			$log.info('Loading parcels information for the extent: ', extent);
			return $http({method: 'JSONP', url: serviceUrl, params: config.params}).
				success(function(data, status) {
					$log.info('loaded parcels successfully.', status, data);
					var olFeatures = olHelper.geoJsonToFeatures({
						"type": "FeatureCollection",
						"features": data.features
					});
					webMappingInteractions.snapParcels(olFeatures);
				})
				.error(function(data, status) {
					$log.error('loading parcels failed!!', status, data);
				});
		}

		return {
			load: _load
		};

	});
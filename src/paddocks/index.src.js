'use strict';

/**
 * @since 0.0.1
 * @copyright 2015 Spatial Vision, Inc. http://spatialvision.com.au
 * @license The MIT License
 * @author Spatial Vision
 * @version 0.1.0
 */


angular.module('farmbuild.webmapping')
	.factory('webMappingPaddocks',
	function ($log) {

		function _findByCoordinate(coordinate, vectorLayer) {
			var paddocks = vectorLayer.getSource().getFeaturesAtCoordinate(coordinate);
			if(paddocks && paddocks.length > 0) {
				return vectorLayer.getSource().getFeaturesAtCoordinate(coordinate)[0];
			}
			return undefined;
		}

		return {
			findByCoordinate: _findByCoordinate
		};

	});

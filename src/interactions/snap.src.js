'use strict';

angular.module('farmbuild.webmapping')
	.factory('webMappingSnapInteraction',
	function (validations,
	          $log) {
		var _isDefined = validations.isDefined;

		function _create(map, farmSource, paddocksSource) {

			var snapInteraction = new ol.interaction.Snap({
				source: paddocksSource
			});

			snapInteraction.addFeature(farmSource.getFeatures()[0]);

			function _enable() {
				snapInteraction.setActive(true);
			}

			function _disable() {
				snapInteraction.setActive(false);
			}

			function _init() {
				$log.info('snap interaction init ...');
				map.addInteraction(snapInteraction);
				snapInteraction.setActive(false);
			}

			return {
				init: _init,
				enable: _enable,
				disable: _disable,
				interaction: snapInteraction
			}
		};

		return {
			create: _create
		}

	});
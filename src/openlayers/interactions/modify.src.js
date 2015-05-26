'use strict';

angular.module('farmbuild.webmapping')
	.factory('modifyInteraction',
	function (validations,
	          $log) {
		var _isDefined = validations.isDefined;

		function _create(map, select) {
			var modifyInteraction = new ol.interaction.Modify({
				features: select.interaction.getFeatures()
			});

			function _init() {
				$log.info('modify interaction init ...');
				map.addInteraction(modifyInteraction);
				modifyInteraction.setActive(false);
			}

			function _enable() {
				modifyInteraction.setActive(true);
			}

			function _disable() {
				modifyInteraction.setActive(false);
			}

			return {
				init: _init,
				enable: _enable,
				disable: _disable,
				interaction: modifyInteraction
			}
		};

		return {
			create: _create
		}

	});
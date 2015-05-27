'use strict';

angular.module('farmbuild.webmapping')
	.factory('selectInteraction',
	function (validations,
	          $log) {
		var _isDefined = validations.isDefined;

		function _create(map, layer) {

			var selectInteraction = new ol.interaction.Select({
				addCondition: ol.events.condition.never,
				toggleCondition: ol.events.condition.never,
				multi: false,
				layers: [layer]
			});

			function _init() {
				$log.info('select interaction init ...');
				map.addInteraction(selectInteraction);
				selectInteraction.setActive(false);
			}

			function _enable() {
				selectInteraction.setActive(true);
			}

			function _disable() {
				selectInteraction.setActive(false);
			}

			return {
				init: _init,
				enable: _enable,
				disable: _disable,
				interaction: selectInteraction
			}

		};

		return {
			create: _create
		}

	});
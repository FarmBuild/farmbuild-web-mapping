'use strict';

angular.module('farmbuild.webmapping')
	.factory('webMappingSelectInteraction',
	function (validations,
	          $log) {
		var _isDefined = validations.isDefined;

		function _create(map, layer, multi) {

			if(!_isDefined(multi)){
				multi = false;
			}

			var selectConfig = {
				multi: multi,
				layers: [layer]
			};

			if(multi){
				selectConfig.addCondition = ol.events.condition.shiftKeyOnly
			} else {
				selectConfig.addCondition = ol.events.condition.never;
				selectConfig.toggleCondition = ol.events.condition.never

			}

			var selectInteraction = new ol.interaction.Select(selectConfig);

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
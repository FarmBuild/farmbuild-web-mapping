'use strict';

angular.module('farmbuild.webmapping')
	.factory('webMappingSelectInteraction',
	function (validations,
	          $rootScope,
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
				selectInteraction.getFeatures().on('change:length', function (e) {
					if (e.target.getArray().length === 0) {
						// this means it's changed to no features selected
						$rootScope.$broadcast('web-mapping-deselect');
					} else {
						// this means there is at least 1 feature selected
						$rootScope.$broadcast('web-mapping-select', {feature: e.target.item(0)});
					}
				});
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
/**
 * @since 0.0.1
 * @copyright 2015 State of Victoria.

 * @author State of Victoria
 * @version 1.0.0
 */

'use strict';

angular.module('farmbuild.webmapping')
	.factory('webMappingDrawInteraction',
	function (validations,
	          $log, $rootScope) {
		var _isDefined = validations.isDefined, _mode;

		function _create(map) {
			var drawInteraction = new ol.interaction.Draw({
				source: new ol.source.Vector(),
				type: /** @type {ol.geom.GeometryType} */ ('Polygon')
			}), drawingStatus = false;

			function _init() {
				$log.info('draw interaction init ...');
				map.addInteraction(drawInteraction);
				drawInteraction.setActive(false);
				drawInteraction.on('drawend', function (e) {
					drawingStatus = false;
					if (_mode === 'draw') {
						$rootScope.$broadcast('web-mapping-draw-end', e.feature);
					}
					if (_mode === 'donut-draw') {
						$rootScope.$broadcast('web-mapping-donut-draw-end', e.feature);
					}

				});
				drawInteraction.on('drawstart', function (event) {
					$log.info('draw start ...');
					drawingStatus = true;
				});
			}

			function _enable(mode) {
				_mode = mode;
				drawInteraction.setActive(true);
			}

			function _disable() {
				drawInteraction.setActive(false);
			}

			function _finish() {
				drawInteraction.finishDrawing();
			}

			function _isDrawing() {
				return drawingStatus;
			}

			function _discard() {
				drawingStatus = false;
				_disable();
				_enable(_mode);
			}

			return {
				init: _init,
				enable: _enable,
				disable: _disable,
				interaction: drawInteraction,
				isDrawing: _isDrawing,
				finish: _finish,
				discard: _discard
			}

		};

		return {
			create: _create
		}

	});

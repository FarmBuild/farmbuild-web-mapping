'use strict';

angular.module('farmbuild.webmapping')
	.factory('webMappingDrawInteraction',
	function (validations,
	          $log) {
		var _isDefined = validations.isDefined;

		function _create(map, farmSource, paddocksSource) {
			var drawInteraction = new ol.interaction.Draw({
				source: paddocksSource,
				type: /** @type {ol.geom.GeometryType} */ ('Polygon')
			}), drawingStatus = false;

			function _init(clipFn, selectInteraction) {
				$log.info('draw interaction init ...');
				map.addInteraction(drawInteraction);
				drawInteraction.setActive(false);
				drawInteraction.on('drawend', function (e) {
					$log.info('draw end ...');
					var feature = e.feature;
					feature.setProperties({name: 'new ' +(new Date()).getTime()});
					clipFn(feature, paddocksSource, farmSource);
					setTimeout(function () {
						paddocksSource.removeFeature(feature);
					}, 100);
					drawingStatus = false;
				});
				drawInteraction.on('drawstart', function (event) {
					$log.info('draw start ...');
					selectInteraction.interaction.getFeatures().clear();
					drawingStatus = true;
				});
			}

			function _enable() {
				drawInteraction.setActive(true);
			}

			function _disable() {
				drawInteraction.setActive(false);
			}

			function _finish(){
				drawInteraction.finishDrawing();
			}

			function _isDrawing() {
				return drawingStatus;
			}

			function _discard() {
				drawingStatus = false;
				_disable();
				_enable();
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
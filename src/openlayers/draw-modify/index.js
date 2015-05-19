'use strict';

angular.module('farmbuild.webmapping')
	.factory('openlayersDraw',
	function (validations,
	          $log) {
		var _featureOverlay, _init = function (source, map) {
			var _isDefined = validations.isDefined, _draw, _modify, _select, _snap, selectedLayer = document.getElementById('layers');
			map.on('click', function (evt) {
				var activeLayer = selectedLayer.value;
				if (source.getFeaturesAtCoordinate(evt.coordinate).length > 0) {
					draw.disable();
					modify.enable();
				} else if (activeLayer === 'farm' || activeLayer === 'paddocks') {
					modify.disable();
					draw.enable();
				} else {
					modify.disable();
					draw.disable();
				}
			});

			// Deselect selected features
			function _removeOverLay() {
				if (_isDefined(_featureOverlay)) {
					_featureOverlay.setStyle(new ol.style.Style({}));
					map.removeOverlay(_featureOverlay);
				}
			};

			// Remove all interactions of map
			function _removeInteractions() {
				map.getInteractions().clear()
				map.addInteraction(new ol.interaction.DragPan({kinetic: null}));
			};

			function _addOverlay(source) {
				// The features are not added to a regular vector layer/source,
// but to a feature overlay which holds a collection of features.
// This collection is passed to the modify and also the draw
// interaction, so that both can add or modify features.
				return new ol.FeatureOverlay({
					features: source.getFeatures(),
					style: new ol.style.Style({
						fill: new ol.style.Fill({
							color: 'rgba(255, 255, 255, 0.2)'
						}),
						stroke: new ol.style.Stroke({
							color: '#ffcc33',
							width: 2
						}),
						image: new ol.style.Circle({
							radius: 7,
							fill: new ol.style.Fill({
								color: '#ffcc33'
							})
						})
					}),
					map: map
				});

			};

			_removeOverLay(map);
			_removeInteractions(map);

// The features are not added to a regular vector layer/source,
// but to a feature overlay which holds a collection of features.
// This collection is passed to the modify and also the draw
// interaction, so that both can add or modify features.
			if (!_isDefined(source)) {
				source = new ol.source.Vector({
					features: []
				});
			}
			_featureOverlay = _addOverlay(source);

			var modify = function () {
				_select = new ol.interaction.Select();
					_modify = new ol.interaction.Modify({
						features: _select.getFeatures()
					});

				function _init() {
					map.addInteraction(_select);
					map.addInteraction(_modify);

					setEvents();
				}

				function _enable() {
					_select.setActive(true);
					_modify.setActive(true);
				}

				function _disable() {
					_select.setActive(false);
					_modify.setActive(false);
				}

				function setEvents() {
					var selectedFeatures = _select.getFeatures();

					_select.on('change:active', function () {
						selectedFeatures.forEach(selectedFeatures.remove, selectedFeatures);
					});
				}

				return {
					init: _init,
					enable: _enable,
					disable: _disable
				}
			}();


			var draw = function () {
				_draw = new ol.interaction.Draw({
					features: _featureOverlay.getFeatures(),
					type: /** @type {ol.geom.GeometryType} */ ('Polygon')
				});

				function _init() {
					map.addInteraction(_draw);
					_draw.setActive(false);
				}

				function _enable() {
					_draw.setActive(true);
				}

				function _disable() {
					_draw.setActive(false);
				}

				return {
					init: _init,
					enable: _enable,
					disable: _disable
				}
			}();

			_snap = new ol.interaction.Snap({
				features: _featureOverlay.getFeatures()
			});


			modify.init();
			draw.init();
			map.addInteraction(_snap);
			draw.disable();
			modify.disable();
		};

		return {
			init: _init
		}

	});
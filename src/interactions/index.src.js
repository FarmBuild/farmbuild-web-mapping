'use strict';

angular.module('farmbuild.webmapping')
	.factory('webMappingInteractions',
	function (validations,
	          $log,
	          webMappingSelectInteraction,
	          webMappingModifyInteraction,
	          webMappingDrawInteraction,
	          webMappingSnapInteraction,
              webMappingGeoProcessing,
	          $rootScope) {
		var _isDefined = validations.isDefined,
			_select, _modify, _draw, _snap, _activeLayer, _activeLayerName,
			_mode,
			_farmLayer, _paddocksLayer, _map,
			_transform = webMappingGeoProcessing,
			_farmName;

		// Remove all interactions of map
		function _destroy(map) {
			$log.info('destroying all interactions ...');
			if (!_isDefined(_select) || !_isDefined(_modify) || !_isDefined(_snap) || !_isDefined(_draw)) {
				return;
			}
			map.removeInteraction(_select.interaction);
			map.removeInteraction(_modify.interaction);
			map.removeInteraction(_draw.interaction);
			_snap.destroy(map);

			_select = undefined;
			_modify = undefined;
			_draw = undefined;
			_snap = undefined;
			_activeLayer = undefined;
			_activeLayerName = undefined;
			_mode = undefined;
		};

		function _init(map, farmLayer, paddocksLayer, activeLayerName, multi) {

			$log.info('interactions init ...');
			if (!_isDefined(activeLayerName) || !_isDefined(map) || !_isDefined(paddocksLayer) || !_isDefined(farmLayer)) {
				return;
			}

			_farmLayer = farmLayer;
			_paddocksLayer = paddocksLayer;
			_map = map;

			if (activeLayerName === 'paddocks') {
				_activeLayer = paddocksLayer;

			} else if (activeLayerName === 'farm') {
				_activeLayer = farmLayer;
				_farmName = _activeLayer.getSource().getFeatures()[0].getProperties().name;
			} else {
				return;
			}

			_select = webMappingSelectInteraction.create(map, _activeLayer, multi);
			_modify = webMappingModifyInteraction.create(map, _select);
			_draw = webMappingDrawInteraction.create(map, farmLayer.getSource(), paddocksLayer.getSource());
			_snap = webMappingSnapInteraction.create(map, farmLayer.getSource(), paddocksLayer.getSource());
			_mode = '';
			_activeLayerName = activeLayerName;

			_select.init();
			_modify.init();
			_draw.init(_clip, _select);
			_snap.init();

		};

		function _addFeature(layer, feature, newProperties) {
			var properties = newProperties || {};
			if (!_isDefined(feature)) {
				return;
			}
			if (!_isDefined(properties.name)) {
				if (_activeLayerName === 'farm') {
					properties.name = _farmName;
				} else {
					properties.name = 'Paddock ' + (new Date()).getTime();
				}
			}
			properties.geometry = feature.getProperties().geometry;
			feature.setProperties(properties);
			$log.info('adding feature ...', feature);
			layer.getSource().addFeature(feature);
			_clearSelections();
		};

		function _remove(features, deselect) {
			if (!_isDefined(deselect)) {
				deselect = true;
			}
			$log.info('removing features ...', features);
			if (_isDefined(features)) {
				features.forEach(function (feature) {
					_activeLayer.getSource().removeFeature(feature);
				});
			}
			if (deselect) {
				_clearSelections()
			}
		};

		function _clip(featureToClip, paddockSource, farmSource) {
			$log.info('clipping feature ...', featureToClip);

			if (_activeLayerName === 'paddocks' && (_mode === 'draw' || _mode === 'edit')) {
				_clipPaddocks(featureToClip, paddockSource, farmSource);
			}

			if (_activeLayerName === 'paddocks' && _mode === 'donut-draw') {
				_clipDonut(featureToClip);
			}

			if (_activeLayerName === 'farm') {
				_clipFarm(featureToClip, farmSource)

			}
		};

		function _clipPaddocks(featureToClip, paddockSource, farmSource) {
			var properties = featureToClip.getProperties(),
				paddocksFeatures, farmFeatures, clipped;
			if (farmSource.getFeatures()[0].getGeometry().getExtent()[0] === Infinity) {
				$log.error('please draw farm boundaries before adding paddock');
				return;
			}
			if(_isDefined(properties.name)) {
				paddockSource.removeFeature(featureToClip);
			}
			paddocksFeatures = paddockSource.getFeatures();
			farmFeatures = farmSource.getFeatures();
			properties = featureToClip.getProperties();
			clipped = _transform.eraseAll(featureToClip, paddocksFeatures);
			clipped = _transform.intersect(clipped, farmFeatures[0]);
			_addFeature(_activeLayer, clipped, properties);
		};

		function _clipDonut(donutFeature) {
			var properties,
				paddockFeature = _activeLayer.getSource().getFeaturesInExtent(donutFeature.getGeometry().getExtent())[0],
				clipped = _transform.erase(paddockFeature, donutFeature);
			if (!_isDefined(paddockFeature)) {
				$log.error('donut must be inside a paddock');
				return;
			}
			properties = paddockFeature.getProperties();
			if (_isDefined(clipped)) {
				_addFeature(_activeLayer, clipped, properties);
				_activeLayer.getSource().removeFeature(paddockFeature);
			}
		};

		function _clipFarm(featureToClip, farmSource) {
			var clipped = featureToClip,
				properties;
			if (farmSource.getFeatures()[0]) {
				properties = farmSource.getFeatures()[0].getProperties();
			}
			if (farmSource.getFeatures()[0] && farmSource.getFeatures()[0].getGeometry().getExtent()[0] !== Infinity) {
				clipped = _transform.erase(featureToClip, farmSource.getFeatures()[0]);
				_addFeature(_activeLayer, clipped, properties);
				clipped = _transform.merge(farmSource.getFeatures());
			}
			_remove(farmSource.getFeatures(), false);
			_addFeature(_activeLayer, clipped, properties);
			_clearSelections();
		};

		function _merge(features) {
			$log.info('merging features ...', features);
			_remove(features, false);
			_addFeature(_activeLayer, _transform.merge(features));
			_clearSelections();
		};

		function _selectedFeatures() {
			if (!_isDefined(_select) || !_isDefined(_select.interaction)) {
				return;
			}
			$log.info('Selected features ...', _select.interaction.getFeatures());
			return _select.interaction.getFeatures();
		};

		function _enableEditing() {
			if (!_isDefined(_mode) || _mode === 'edit') {
				return;
			}
			$log.info('editing enabled');
			_select.enable();
			_modify.enable();
			_draw.disable();
			_mode = 'edit';
		};

		function _enableDrawing() {
			if (!_isDefined(_mode) || _mode === 'draw') {
				return;
			}
			$log.info('drawing enabled');
			_select.disable();
			_modify.disable();
			_draw.enable();
			_mode = 'draw';
		};

		function _enableDonutDrawing() {
			if (!_isDefined(_mode) || _mode === 'donut-draw') {
				return;
			}
			$log.info('donut drawing enabled');
			_select.disable();
			_modify.disable();
			_draw.enable();
			_mode = 'donut-draw';
		};

		function _snapParcels(parcels) {
			if (!_isDefined(parcels) || !_isDefined(_snap)) {
				$log.error('Snap interaction is undefined, select a layer to start!');
				return;
			}
			_snap.addFeatures(parcels);
		};

		function _clearSelections() {
			_select.interaction.getFeatures().clear();
		};

		function _isDrawing() {
			if (!_isDefined(_mode)) {
				return;
			}
			return _draw.isDrawing();
		};

		function _finishDrawing() {
			if (!_isDefined(_mode)) {
				return;
			}
			_draw.finish();
		};

		function _discardDrawing() {
			if (!_isDefined(_mode)) {
				return;
			}
			_draw.discard();
		};

		function _isEditing() {
			if (!_isDefined(_mode)) {
				return;
			}
			return _select.interaction.getFeatures().getLength() > 0;
		};

		function _disableSnapping() {
			if (!_isDefined(_snap)) {
				return;
			}
			return _snap.disable();
		};

		function _isSnappingActive() {
			if (!_isDefined(_snap)) {
				return;
			}
			return _snap.interaction.getActive();
		};

		function _enableSnapping() {
			if (!_isDefined(_snap)) {
				return;
			}
			return _snap.enable();
		};

		function _showParcels() {
			if (!_isDefined(_snap)) {
				return;
			}
			return _snap.show();
		};

		function _hideParcels() {
			if (!_isDefined(_snap)) {
				return;
			}
			return _snap.hide();
		};

		$rootScope.$on('web-mapping-measure-start', function (event, data) {
			if (!_isDefined(_select) || !_isDefined(_modify) || !_isDefined(_draw)) {
				return;
			}
			_select.disable();
			_modify.disable();
			_draw.disable();
		});

		$rootScope.$on('web-mapping-measure-end', function (event, data) {
			if (!_isDefined(_select) || !_isDefined(_modify) || !_isDefined(_draw)) {
				return;
			}
			_select.enable();
			_modify.enable();
			_draw.disable();
		});

		function _enableKeyboardShortcuts(elementId) {
			var element = document.getElementById(elementId) || _map.getTargetElement();

			function onKeyDown(event) {
				var selectedFeatures = _selectedFeatures();
				if (!_isDefined(selectedFeatures)) {
					return;
				}

				if (event.keyCode == 46 || event.keyCode == 8) {
					_remove(selectedFeatures);
					event.preventDefault();
					event.stopPropagation();
					return false;
				}

				if (event.keyCode == 13) {

					if (_isDrawing()) {
						_finishDrawing();
					} else {
						_clip(_selectedFeatures().item(0), _paddocksLayer.getSource(), _farmLayer.getSource());
					}

					event.preventDefault();
					event.stopPropagation();
					return false;
				}

				if (event.keyCode == 27) {
					_discardDrawing();
					event.preventDefault();
					event.stopPropagation();
					return false;
				}
			}

			element.addEventListener('keydown', onKeyDown);

		};

		return {
			init: _init,
			destroy: _destroy,
			editing: {
				enable: _enableEditing,
				isEditing: _isEditing
			},
			drawing: {
				discard: _discardDrawing,
				finish: _finishDrawing,
				enable: _enableDrawing,
				isDrawing: _isDrawing
			},
			donut: {
				enable: _enableDonutDrawing
			},
			snapping: {
				enable: _enableSnapping,
				disable: _disableSnapping,
				active: _isSnappingActive
			},
			features: {
				selected: _selectedFeatures,
				clip: _clip,
				merge: _merge,
				remove: _remove
			},
			parcels: {
				snap: _snapParcels,
				show: _showParcels,
				hide: _hideParcels
			},
			keyboardShortcuts: {
				enable: _enableKeyboardShortcuts
			}
		}
	});

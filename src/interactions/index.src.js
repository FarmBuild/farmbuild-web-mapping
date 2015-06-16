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
			_farmLayerGroup, _farmLayer, _paddocksLayer, _map,
			_transform = webMappingGeoProcessing,
			_farmName,
			_donutContainer;

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

		function _init(map, farmLayerGroup, activeLayerName, multi) {

			$log.info('interactions init ...');
			if (!_isDefined(activeLayerName) || !_isDefined(map) || !_isDefined(farmLayerGroup)) {
				return;
			}

			_farmLayerGroup = farmLayerGroup;
			_farmLayer = farmLayerGroup.getLayers().item(1);
			_paddocksLayer = farmLayerGroup.getLayers().item(0);
			_map = map;

			if (activeLayerName === 'paddocks') {
				_activeLayer = _paddocksLayer;

			} else if (activeLayerName === 'farm') {
				_activeLayer = _farmLayer;
				_farmName = _activeLayer.getSource().getFeatures()[0].getProperties().name;
			} else {
				return;
			}

			_select = webMappingSelectInteraction.create(map, _activeLayer, multi);
			_modify = webMappingModifyInteraction.create(map, _select);
			_draw = webMappingDrawInteraction.create(map, farmLayerGroup);
			_snap = webMappingSnapInteraction.create(map, _farmLayer.getSource(), _paddocksLayer.getSource());
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
			return feature;
		};

		function _remove(features, deselect) {
			if (!_isDefined(features) || !_isDefined(_activeLayer)) {
				return;
			}
			if (!_isDefined(deselect)) {
				deselect = true;
			}
			$log.info('removing features ...', features);
			features.forEach(function (feature) {
				try {
					_activeLayer.getSource().removeFeature(feature);
				} catch (e) {
					$log.error(e);
				}
			});
			if (deselect) {
				_clearSelections()
			}
		};

		function _clip(featureToClip, farmLayers) {
			if (!_isDefined(farmLayers) || !_isDefined(farmLayers.getLayers()) || !_isDefined(featureToClip) || !_isDefined(farmLayers.getLayers().item(0)) || !_isDefined(farmLayers.getLayers().item(1))) {
				return;
			}
			$log.info('clipping feature ...', featureToClip);
			var paddockSource = farmLayers.getLayers().item(0).getSource(),
				farmSource = farmLayers.getLayers().item(1).getSource();

			if (_activeLayerName === 'paddocks' && (_mode === 'draw' || _mode === 'edit')) {
				return _clipPaddocks(featureToClip, paddockSource, farmSource);
			}

			if (_activeLayerName === 'paddocks' && _mode === 'donut-draw') {
				return _clipDonut(featureToClip);
			}

			if (_activeLayerName === 'farm') {
				return _clipFarm(featureToClip, farmSource)

			}
		};

		function _clipPaddocks(featureToClip, paddockSource, farmSource) {
			var properties = featureToClip.getProperties(),
				paddocksFeatures, farmFeatures, clipped;
			if (farmSource.getFeatures()[0].getGeometry().getExtent()[0] === Infinity) {
				$log.error('please draw farm boundaries before adding paddock');
				return;
			}
			if (_isDefined(properties.name)) {
				paddockSource.removeFeature(featureToClip);
			}
			paddocksFeatures = paddockSource.getFeatures();
			farmFeatures = farmSource.getFeatures();
			properties = featureToClip.getProperties();
			clipped = _transform.eraseAll(featureToClip, paddocksFeatures);
			clipped = _transform.intersect(clipped, farmFeatures[0]);
			return _addFeature(_activeLayer, clipped, properties);
		};

		function _clipDonut(donutFeature) {
			var properties,
				paddockFeature = _donutContainer,
				clipped = _transform.erase(paddockFeature, donutFeature);
			if (!_isDefined(paddockFeature)) {
				$log.error('donut must be inside a paddock');
				return;
			}
			properties = paddockFeature.getProperties();
			if (_isDefined(clipped)) {
				_activeLayer.getSource().removeFeature(paddockFeature);
				return _addFeature(_activeLayer, clipped, properties);
			}
		};

		function _clipFarm(featureToClip, farmSource) {
			var clipped = featureToClip,
				properties, result;
			if (farmSource.getFeatures()[0]) {
				properties = farmSource.getFeatures()[0].getProperties();
			}
			if (farmSource.getFeatures()[0] && farmSource.getFeatures()[0].getGeometry().getExtent()[0] !== Infinity) {
				clipped = _transform.erase(featureToClip, farmSource.getFeatures()[0]);
				_addFeature(_activeLayer, clipped, properties);
				clipped = _transform.merge(farmSource.getFeatures());
			}
			_remove(farmSource.getFeatures(), false);
			result = _addFeature(_activeLayer, clipped, properties);
			_clearSelections();
			return result;
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
			if (!_isDefined(_mode) || _mode === 'edit' || _mode === 'measure') {
				return;
			}
			$log.info('editing enabled');
			_mode = 'edit';
			_select.enable();
			_modify.enable();
			_draw.disable();
		};

		function _enableDrawing() {
			if (!_isDefined(_mode) || _mode === 'draw' || _mode === 'measure') {
				return;
			}
			$log.info('drawing enabled');
			_mode = 'draw';
			_select.disable();
			_modify.disable();
			_draw.enable(_mode);
		};

		function _enableDonutDrawing() {
			if (!_isDefined(_mode) || _mode === 'donut-draw') {
				return;
			}
			$log.info('donut drawing enabled');
			_donutContainer = _selectedFeatures().item(0);
			_mode = 'donut-draw';
			_select.disable();
			_modify.disable();
			_draw.enable(_mode);
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

		$rootScope.$on('web-mapping-measure-start', function (event, data) {
			if (!_isDefined(_select) || !_isDefined(_modify) || !_isDefined(_draw)) {
				return;
			}
			_select.disable();
			_modify.disable();
			_draw.disable();
			_mode = 'measure';
		});

		$rootScope.$on('web-mapping-measure-end', function (event, data) {
			if (!_isDefined(_select) || !_isDefined(_modify) || !_isDefined(_draw)) {
				return;
			}
			_select.enable();
			_modify.enable();
			_draw.disable();
			_mode = 'edit';
		});

		$rootScope.$on('web-mapping-draw-end', function (event, feature) {
			$log.info('draw end ...');
			_clip(feature, _farmLayerGroup);
		});

		$rootScope.$on('web-mapping-donut-draw-end', function (event, feature) {
			$log.info('donut draw end ...');
			_select.interaction.getFeatures().push(_clip(feature, _farmLayerGroup));
			_donutContainer = null;
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
						_clip(_selectedFeatures().item(0), _farmLayerGroup);
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
				selections: _selectedFeatures,
				clip: _clip,
				merge: _merge,
				remove: _remove
			},
			parcels: {
				snap: _snapParcels
			},
			keyboardShortcuts: {
				enable: _enableKeyboardShortcuts
			}
		}
	});

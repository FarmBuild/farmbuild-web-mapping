'use strict';

angular.module('farmbuild.webmapping')
	.factory('webMappingInteractions',
	function (validations,
	          $log,
	          webMappingSelectInteraction,
	          webMappingModifyInteraction,
	          webMappingDrawInteraction,
	          webMappingSnapInteraction,
	          webMappingMeasureInteraction,
	          webMappingTransformation) {
		var _isDefined = validations.isDefined,
			_select, _modify, _draw, _snap, _activeLayer, _activeLayerName,
			_mode,
			_transform = webMappingTransformation;

		// Remove all interactions of map
		function _destroy(map) {
			$log.info('destroying all interactions ...');
			if (!_isDefined(_select) || !_isDefined(_modify) || !_isDefined(_snap) || !_isDefined(_draw) || !_isDefined(_measure)) {
				return;
			}
			map.removeInteraction(_select.interaction);
			map.removeInteraction(_modify.interaction);
			map.removeInteraction(_draw.interaction);
			map.removeInteraction(_snap.interaction);

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

			if (activeLayerName === 'paddocks') {
				_activeLayer = paddocksLayer;

			} else if (activeLayerName === 'farm') {
				_activeLayer = farmLayer;
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

		function _addFeature(layer, feature, name) {
			if (!_isDefined(feature) || !_isDefined(name)) {
				return;
			}
			$log.info('adding feature ...', feature);
			feature.setProperties({name: name});
			layer.getSource().addFeature(feature);
			_clearSelections();
		};

		function _removeFeatures(features, deselect) {
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
			if (farmSource.getFeatures()[0].getGeometry().getExtent()[0] === Infinity) {
				return;
			}
			var clipped,
				paddocksFeatures = paddockSource.getFeatures(),
				farmFeatures = farmSource.getFeatures(),
				name = featureToClip.getProperties().name || 'Paddock ' + (new Date()).getTime();
			clipped = _transform.eraseAll(featureToClip, paddocksFeatures);
			clipped = _transform.intersect(clipped, farmFeatures[0]);
			_addFeature(_activeLayer, clipped, name);
		};

		function _clipDonut(donutFeature) {
			var clipped,
				paddockFeature = _activeLayer.getSource().getFeaturesInExtent(donutFeature.getGeometry().getExtent())[0],
				name = donutFeature.getProperties().name || 'Paddock ' + (new Date()).getTime();
			clipped = _transform.erase(paddockFeature, donutFeature);
			_addFeature(_activeLayer, clipped, name);
			_activeLayer.getSource().removeFeature(paddockFeature);
		};

		function _clipFarm(featureToClip, farmSource) {
			var clipped = featureToClip,
				name;
			if (farmSource.getFeatures()[0]) {
				name = farmSource.getFeatures()[0].getProperties().name;
			}
			if (farmSource.getFeatures()[0].getGeometry().getExtent()[0] !== Infinity) {
				clipped = _transform.erase(featureToClip, farmSource.getFeatures()[0]);
				_addFeature(_activeLayer, clipped, name);
				clipped = _transform.merge(farmSource.getFeatures());
			}
			_removeFeatures(farmSource.getFeatures(), false);
			_addFeature(_activeLayer, clipped, name);
			_clearSelections();
		};

		function _merge(features) {
			$log.info('merging features ...', features);
			_removeFeatures(features, false);
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
			_snap.enable();
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
			_snap.enable();
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
			_snap.enable();
			_mode = 'donut-draw';
		};

		function _measure(map, type) {
			if (!_isDefined(map) || !_isDefined(type)) {
				return;
			}
			_select.disable();
			_modify.disable();
			_draw.disable();
			_snap.enable();
			return webMappingMeasureInteraction.create(map, type);
		}

		function _measureLength(map) {
			if (!_isDefined(map) || _mode === 'length') {
				return;
			}
			$log.info('length measurement enabled');
			_mode = 'length';
			return _measure(map, 'LineString');
		};

		function _measureArea(map) {
			if (!_isDefined(_mode) || _mode === 'area') {
				return;
			}
			$log.info('area measurement enabled');
			_mode = 'area';
			return _measure(map, 'Polygon');
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

		return {
			init: _init,
			destroy: _destroy,
			enableDrawing: _enableDrawing,
			enableEditing: _enableEditing,
			enableDonutDrawing: _enableDonutDrawing,
			isDrawing: _isDrawing,
			isEditing: _isEditing,
			finishDrawing: _finishDrawing,
			discardDrawing: _discardDrawing,
			measureLength: _measureLength,
			measureArea: _measureArea,
			clip: _clip,
			merge: _merge,
			remove: _removeFeatures,
			selectedFeatures: _selectedFeatures
		}
	});
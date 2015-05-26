'use strict';

angular.module('farmbuild.webmapping')
	.factory('webMappingInteractions',
	function (validations,
	          $log,
	          selectInteraction, modifyInteraction, drawInteraction, snapInteraction) {
		var _isDefined = validations.isDefined,
			_geoJSONFormat = new ol.format['GeoJSON'](),
			_select, _modify, _draw, _snap, _activeLayer, _activeLayerName,
			_mode;

		// Remove all interactions of map
		function _destroy(map) {
			$log.info('destroying all interactions ...');
			map.getInteractions().clear();
			map.addInteraction(new ol.interaction.DragPan({kinetic: null}));
			_select = undefined;
			_modify = undefined;
			_draw = undefined;
			_snap = undefined;
			_activeLayer = undefined;
			_activeLayerName = undefined;
			_mode = undefined;
		};

		function _init(map, farmLayer, paddocksLayer, activeLayerName) {

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

			_select = selectInteraction.create(map, _activeLayer);
			_modify = modifyInteraction.create(map, _select);
			_draw = drawInteraction.create(map, farmLayer.getSource(), paddocksLayer.getSource());
			_snap = snapInteraction.create(map, farmLayer.getSource(), paddocksLayer.getSource());
			_mode = '';
			_activeLayerName = activeLayerName;

			_select.init();
			_modify.init();
			_draw.init(_clip, _select);
			_snap.init();

		};


		function _featureToGeoJson(feature) {
			return angular.fromJson(_geoJSONFormat.writeFeature(feature));
		};

		function _featuresToGeoJson(features) {
			if(features.getArray) {
				return angular.fromJson(_geoJSONFormat.writeFeatures(features.getArray()));
			}
			return angular.fromJson(_geoJSONFormat.writeFeatures(features));
		};

		function _addGeoJsonFeature(layer, feature) {
			if (!_isDefined(feature)) {
				return;
			}
			$log.info('adding feature ...', feature);
			layer.getSource().addFeature(new ol.Feature({
				geometry: new ol.geom[feature.geometry.type](feature.geometry.coordinates)
			}));
			_select.interaction.getFeatures().clear();
		};

		function _merge(features) {
			$log.info('merging features ...', features);
			var toMerge;
			_remove(features, false);
			toMerge = _featuresToGeoJson(features);
			try {
				_addGeoJsonFeature(_activeLayer, turf.merge(toMerge));
				_select.interaction.getFeatures().clear();
			} catch (e) {
				$log.error(e);
			}

		};

		function _erase(feature, features) {
			try {
				features.forEach(function (layerFeature) {
					var clipper = _featureToGeoJson(layerFeature);
					feature = turf.erase(feature, clipper);
				});
				return feature;
			} catch (e) {
				$log.error(e);
			}
		};

		function _intersect(feature, features) {
			try {
				features.forEach(function (layerFeature) {
					var clipper = _featureToGeoJson(layerFeature);
					feature = turf.intersect(feature, clipper);
				});
				return feature;
			} catch (e) {
				$log.error(e);
			}
		};

		function _clip(feature, paddockSource, farmSource) {
			$log.info('clipping feature ...', feature);

			var featureToClip = _featureToGeoJson(feature);

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
			var clipped,
				paddocksFeatures = paddockSource.getFeatures(),
				farmFeatures = farmSource.getFeatures();
			clipped = _erase(featureToClip, paddocksFeatures);
			clipped = _intersect(clipped, farmFeatures);

			_addGeoJsonFeature(_activeLayer, clipped);
		};

		function _clipDonut(donutFeature) {
			var clipped, paddockFeature, paddockGeoJsonFeature;
			paddockFeature = _activeLayer.getSource().getFeaturesAtCoordinate(donutFeature.geometry.coordinates[0][1])[0];
			paddockGeoJsonFeature = _featureToGeoJson(paddockFeature);
			clipped = turf.erase(paddockGeoJsonFeature, donutFeature);
			_addGeoJsonFeature(_activeLayer, clipped);
			_activeLayer.getSource().removeFeature(paddockFeature);
		};

		function _clipFarm(featureToClip, farmSource) {
			var farmFeatures = farmSource.getFeatures(),
				clipped = _erase(featureToClip, farmFeatures);
			_addGeoJsonFeature(_activeLayer, clipped);
			_merge(farmSource.getFeatures());
		};

		function _area(features) {
			$log.info('calculating area of features ...', features);
			var geoJsonFeatures = _featuresToGeoJson(features);
			return turf.area(geoJsonFeatures) * 0.0001;
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
				_select.interaction.getFeatures().clear();
			}
		};

		function _selectedFeatures() {
			if (!_isDefined(_select) || !_isDefined(_select.interaction)) {
				return;
			}
			$log.info('Selected features ...', _select.interaction.getFeatures());
			return _select.interaction.getFeatures();
		};

		function _enableEditing() {
			if (!-_isDefined(_mode) || _mode === 'edit') {
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
			if (!-_isDefined(_mode) || _mode === 'draw') {
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
			if (!-_isDefined(_mode) || _mode === 'donut-draw') {
				return;
			}
			$log.info('donut drawing enabled');
			_select.disable();
			_modify.disable();
			_draw.enable();
			_snap.enable();
			_mode = 'donut-draw';
		};

		function _isDrawing() {
			if (!-_isDefined(_mode)) {
				return;
			}
			return _draw.isDrawing();
		};

		function _isEditing() {
			if (!-_isDefined(_mode)) {
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
			merge: _merge,
			remove: _remove,
			clip: _clip,
			area: _area,
			selectedFeatures: _selectedFeatures,
			isDrawing: _isDrawing,
			isEditing: _isEditing
		}
	});
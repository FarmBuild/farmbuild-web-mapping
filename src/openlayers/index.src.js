'use strict';

angular.module('farmbuild.webmapping')
	.factory('openLayers',
	function (validations,
	          $log,
	          interactions,
	          googlemapslayer) {
		var defaults = {
				centerNew: [-36.22488327137526, 145.5826132801325],
				zoomNew: 6
			},
			_map,
			_paddocksLayer,
			_farmLayer,
			_size,
			_view,
			_paddocksSource,
			_farmSource,
			_targetElementId,
			_layerSelectionElementId,
			_isNew,
			_targetEl = document.getElementById('olmap'),
			_projection = 'EPSG:4326',
			_isDefined = validations.isDefined;

		function _init(targetElementId, layerSelectionElementId, farmGeometry, paddocksGeometry) {
			var isNew;
			if (!_isDefined(farmGeometry)) {
				paddocksGeometry = {
					"type": "FeatureCollection",
					"features": []
				};
				farmGeometry = {
					"type": "FeatureCollection",
					"features": []
				};
				isNew = true;
			}
			_targetElementId = targetElementId;
			_layerSelectionElementId = layerSelectionElementId;
			_isNew = isNew;

			if (_isDefined(_map) && _map.setTarget) {
				_map.setTarget(null);
				_map = null;
			}

			var _layerSelectionElement = document.getElementById(layerSelectionElementId);

			proj4.defs("EPSG:4283", "+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs");
			var projection = ol.proj.get({code: 'EPSG:4283'});

			_view = new ol.View({
				rotation: 0,
				projection: projection,
				maxZoom: 21
			});

			_paddocksSource = new ol.source.Vector({
				features: (new ol.format.GeoJSON()).readFeatures(paddocksGeometry, {
					dataProjection: 'EPSG:4283',
					featureProjection: 'EPSG:3857'
				})
			});

			_farmSource = new ol.source.Vector({
				features: (new ol.format.GeoJSON()).readFeatures(farmGeometry, {
					dataProjection: 'EPSG:4283',
					featureProjection: 'EPSG:3857'
				})
			});

			_paddocksLayer = new ol.layer.Vector({
				source: _paddocksSource,
				style: new ol.style.Style({
					fill: new ol.style.Fill({
						color: 'rgba(255, 255, 255, 0.3)'
					}),
					stroke: new ol.style.Stroke({
						color: '#319FD3',
						width: 1
					})
				})
			});

			_farmLayer = new ol.layer.Vector({
				source: _farmSource,
				style: new ol.style.Style({
					fill: new ol.style.Fill({
						color: 'rgba(255, 255, 255, 0)'
					}),
					stroke: new ol.style.Stroke({
						color: '#ff6600',
						width: 3
					})
				})
			});

			_map = new ol.Map({
				layers: [_paddocksLayer, _farmLayer],
				target: targetElementId,
				view: _view,
				interactions: ol.interaction.defaults({
					altShiftDragRotate: false,
					dragPan: false,
					rotate: false,
					mouseWheelZoom: true
				}).extend([new ol.interaction.DragPan({kinetic: null})]),
				controls: ol.control.defaults({
					attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
						collapsible: false
					})
				}).extend([
					new ol.control.ZoomToExtent({
						extent: _farmSource.getExtent()
					}),
					new ol.control.ScaleLine()
				])
			});

			_size = /** @type {ol.Size} */ (_map.getSize());

			// Deselect all selections when layer is changed from farm to paddocks.
//			_layerSelectionElement.addEventListener('change', function () {
//				var layer;
//				if (_layerSelectionElement.value === "paddocks") {
//					layer = _paddocksLayer;
//				}
//				if (_layerSelectionElement.value === "farm") {
//					layer = _farmLayer;
//				}
//				openlayersDraw.init(layer, _map);
//			});

			return {
				map: _map,
				view: _view
			};
		};

		function _transform(latLng, sourceProjection, destinationProjection) {
			var transformed = ol.proj.transform(latLng, sourceProjection, destinationProjection);
			return new google.maps.LatLng(transformed[1], transformed[0])
		};

		function _transform(latLng, sourceProjection, destinationProjection) {
			var transformed = ol.proj.transform(latLng, sourceProjection, destinationProjection);
			return new google.maps.LatLng(transformed[1], transformed[0])
		};

		// replace this function by what you need
		function _exportGeometry() {
			// define a format the data shall be converted to
			var format = new ol.format['GeoJSON'](),
			// this will be the data in the chosen format
				data;
			try {
				// convert the data of the vector_layer into the chosen format
				data = format.writeFeatures(_paddocksLayer.getSource().getFeatures());
			} catch (e) {
			}
			// format is JSON
			return JSON.stringify(data, null, 4);
		};

		function _clear() {
			_paddocksSource.clear();
			_farmSource.clear();
		};

		function _integrateGMap(gmap) {
			_view.on('change:center', function () {
				var center = ol.proj.transform(_view.getCenter(), googlemapslayer.getProjection(), _projection);
				gmap.setCenter(new google.maps.LatLng(center[1], center[0]));
			});

			_view.on('change:resolution', function () {
				gmap.setZoom(_view.getZoom());
			});

			// Google Map and vector layers go out of sync when window is resized.
			window.onresize = function () {
				var center = _transform(_view.getCenter(), googlemapslayer.getProjection(), _projection);
				google.maps.event.trigger(gmap, "resize");
				gmap.setCenter(center);
			};

			if (_isNew) {
				gmap.controls[google.maps.ControlPosition.TOP_LEFT].push(_targetEl);
				_targetEl.parentNode.removeChild(_targetEl);
				_view.setCenter(ol.proj.transform([defaults.centerNew[1], defaults.centerNew[0]],
					_projection, googlemapslayer.getProjection()));
				_view.setZoom(defaults.zoomNew);
			} else {
				gmap.controls[google.maps.ControlPosition.TOP_LEFT].push(_targetEl);
				_targetEl.parentNode.removeChild(_targetEl);
				_view.fitExtent(_farmSource.getExtent(), _size);
			}
		};

		function _getView() {
			return _view;
		};

		function _getProjection() {
			return _projection;
		};

		function _center(coordinates) {
			_view.setCenter(coordinates);
			_view.setZoom(15);
		};

		function _paddocksLayer(paddocksGeometry) {
			var _paddocksSource = new ol.source.Vector({
				features: (new ol.format.GeoJSON()).readFeatures(paddocksGeometry, {
					dataProjection: 'EPSG:4283',
					featureProjection: 'EPSG:3857'
				})
			});

			return new ol.layer.Vector({
				source: _paddocksSource,
				style: new ol.style.Style({
					fill: new ol.style.Fill({
						color: 'rgba(255, 255, 255, 0.3)'
					}),
					stroke: new ol.style.Stroke({
						color: '#319FD3',
						width: 1
					})
				})
			});
		};

		function _farmLayer(farmGeometry) {
			var paddocksSource = new ol.source.Vector({
				features: (new ol.format.GeoJSON()).readFeatures(farmGeometry, {
					dataProjection: 'EPSG:4283',
					featureProjection: 'EPSG:3857'
				})
			});

			return new ol.layer.Vector({
				source: paddocksSource,
				style: new ol.style.Style({
					fill: new ol.style.Fill({
						color: 'rgba(255, 255, 255, 0.3)'
					}),
					stroke: new ol.style.Stroke({
						color: '#319FD3',
						width: 1
					})
				})
			});
		};

		return {
			init: _init,
			exportGeometry: _exportGeometry,
			clear: _clear,
			center: _center,
			integrateGMap: _integrateGMap,
			getProjection: _getProjection,

			paddocksLayer: _paddocksLayer,
			farmLayer: _farmLayer
		}

	});
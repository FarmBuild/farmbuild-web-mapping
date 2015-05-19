'use strict';

angular.module('farmbuild.webmapping')
	.factory('openlayersmap',
	function (validations,
	          $log,
	          openlayersDraw) {
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
			_init = function (gmap, farm, paddocks, isNew, target) {

				if (_map && _map.setTarget) {
					_map.setTarget(null);
					_map = null;
				}

				var selectedLayer = document.getElementById('layers');

				proj4.defs("EPSG:4283", "+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs");
				var projection = ol.proj.get({code: 'EPSG:4283'});

				_view = new ol.View({
						rotation: 0,
						projection: projection,
						maxZoom: 21
					});
					_paddocksSource = new ol.source.Vector({
						features: (new ol.format.GeoJSON()).readFeatures(paddocks, {
							dataProjection: 'EPSG:4283',
							featureProjection: 'EPSG:3857'
						})
					})
					_farmSource = new ol.source.Vector({
						features: (new ol.format.GeoJSON()).readFeatures(farm, {
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
						target: target,
						view: _view,
						interactions: ol.interaction.defaults({
							altShiftDragRotate: false,
							dragPan: false,
							rotate: false,
							mouseWheelZoom: false
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

				_view.on('change:center', function () {
					var center = ol.proj.transform(_view.getCenter(), 'EPSG:3857', 'EPSG:4326');
					gmap.setCenter(new google.maps.LatLng(center[1], center[0]));
				});

				_view.on('change:resolution', function () {
					gmap.setZoom(_view.getZoom());
				});

				if (isNew) {
					gmap.setCenter(new google.maps.LatLng(defaults.centerNew[0], defaults.centerNew[1]));
					_view.setCenter(ol.proj.transform([defaults.centerNew[1], defaults.centerNew[0]], 'EPSG:4326', 'EPSG:3857'));
					_view.setZoom(defaults.zoomNew);
				} else {
					var targetEl = document.getElementById(target);
					targetEl.parentNode.removeChild(targetEl);
					gmap.controls[google.maps.ControlPosition.TOP_LEFT].push(targetEl);
					_view.fitExtent(_farmSource.getExtent(), _size);
				}

				// Deselect all selections when layer is changed from farm to paddocks.
				selectedLayer.addEventListener('change', function () {
					var source;
					if (selectedLayer.value === "paddocks") {
						source = _paddocksSource;
					}
					if (selectedLayer.value === "farm") {
						source = _farmSource;
					}
					openlayersDraw.init(source, _map);
				});

				// Google Map and vector layers go out of sync when window is resized.
				window.onresize = function () {
					var center = _transform(_view.getCenter(), 'EPSG:3857', 'EPSG:4326');
					google.maps.event.trigger(gmap, "resize");
					gmap.setCenter(center);
				};

				return {
					map: _map,
					view: _view
				};
			},

			_transform = function (latLng, sourceProjection, destinationProjection) {
				var transformed = ol.proj.transform(latLng, sourceProjection, destinationProjection);
				return new google.maps.LatLng(transformed[1], transformed[0])
			},

			_loadNew = function (gmap) {
				var paddocks = {
					"type": "FeatureCollection",
					"features": []
				}, farm = {
					"type": "FeatureCollection",
					"features": []
				};
				return _init(gmap, farm, paddocks, true, 'olmap');
			},

			_loadExisting = function (gmap, farm, paddocks) {
				return _init(gmap, farm, paddocks, false, 'olmap');
			},

			_load = function (gmap, farm, paddocks) {
				if (!farm) {
					return _loadNew(gmap);
				} else {
					return _loadExisting(gmap, farm, paddocks)
				}
			},

		// replace this function by what you need
			_exportGeometry = function () {
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
			},

			_clear = function () {
				_paddocksSource.clear();
				_farmSource.clear();
			};

		return {
			load: _load,
			exportGeometry: _exportGeometry,
			clear: _clear
		}

	});
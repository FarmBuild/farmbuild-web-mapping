var olMapDiv = document.getElementById('olmap'),
	map, saveData, view, isNew = false, centerNew = [-36.22488327137526, 145.5826132801325], zoomNew = 6, paddocksSource, farmSource, selectedLayer;
initOlMap = function (farm, paddocks) {

	selectedLayer = document.getElementById('layers');

	proj4.defs("EPSG:4283", "+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs");
	var projection = ol.proj.get({code: 'EPSG:4283'});

	var view = new ol.View({
		rotation: 0,
		projection: projection,
		maxZoom: 21
	});

	if (isNew) {
		paddocks = {
			"type": "FeatureCollection",
			"features": []
		};

		farm = {
			"type": "FeatureCollection",
			"features": []
		}
	}

	paddocksSource = new ol.source.Vector({
		features: (new ol.format.GeoJSON()).readFeatures(paddocks, {dataProjection: 'EPSG:4283', featureProjection: 'EPSG:3857'})
	});

	farmSource = new ol.source.Vector({
		features: (new ol.format.GeoJSON()).readFeatures(farm, {dataProjection: 'EPSG:4283', featureProjection: 'EPSG:3857'})
	});

	var paddocksLayer = new ol.layer.Vector({
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
		}),

		farmLayer = new ol.layer.Vector({
			source: farmSource,
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

	map = new ol.Map({
		layers: [paddocksLayer, farmLayer],
		target: olMapDiv,
		view: view,
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
				extent: farmSource.getExtent()
			}),
			new ol.control.ScaleLine()
		])
	});

	var size = /** @type {ol.Size} */ (map.getSize());

	view.on('change:center', function () {
		var center = ol.proj.transform(view.getCenter(), 'EPSG:3857', 'EPSG:4326');
		gmap.setCenter(new google.maps.LatLng(center[1], center[0]));
	});

	view.on('change:resolution', function () {
		gmap.setZoom(view.getZoom());
	});

	if (isNew) {
		gmap.setCenter(new google.maps.LatLng(centerNew[0], centerNew[1]));
		view.setCenter(ol.proj.transform([centerNew[1], centerNew[0]], 'EPSG:4326', 'EPSG:3857'));
		view.setZoom(zoomNew);
	} else {
		view.fitExtent(farmSource.getExtent(), size);
	}

	// Deselect all selections when layer is changed from farm to paddocks.
	selectedLayer.addEventListener('change', function () {
		//deselectFeatures();
	});

	function clearMap() {
		paddocksLayer.getSource().clear();
		farmLayer.getSource().clear();
		if (select) {
			select.getFeatures().clear();
		}
	}

	// replace this function by what you need
	saveData = function () {
		// define a format the data shall be converted to
		var format = new ol.format['GeoJSON'](),
		// this will be the data in the chosen format
			data;
		try {
			// convert the data of the vector_layer into the chosen format
			data = format.writeFeatures(paddocksLayer.getSource().getFeatures());
		} catch (e) {
		}
		// format is JSON
		return JSON.stringify(data, null, 4);
	};

	// Google Map and vector layers go out of sync when window is resized.
	window.onresize = function () {
		setTimeout(function () {
			var features = paddocksSource.getFeatures();
			//paddocksSource.clear();
			//paddocksSource.addFeatures(features);
			//gmap.setCenter(new google.maps.LatLng(view.getCenter()[0], view.getCenter()[1]));
			//gmap.setZoom(view.getZoom());
		}, 500);

	};

};
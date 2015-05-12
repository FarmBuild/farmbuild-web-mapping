var olMapDiv = document.getElementById('olmap'),
	map, saveData, view, isNew = false,
	initOlMap = function (farm, paddocks) {
		var selectedLayer = document.getElementById('layers');

		view = new ol.View({
			rotation: 0,
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

		var paddocksSource = new ol.source.GeoJSON(
				({
					projection: 'EPSG:3857',
					"object": paddocks
				})
			),

			paddocksLayer = new ol.layer.Vector({
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

			farmSource = new ol.source.GeoJSON(
				({
					"object": farm,
					projection: 'EPSG:3857'
				})
			),

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
			gmap.setCenter(new google.maps.LatLng(-36.22488327137526, 145.5826132801325));
			view.setCenter(ol.proj.transform([145.5826132801325, -36.22488327137526], 'EPSG:4326', 'EPSG:3857'));
			view.setZoom(6);
		} else {
			view.fitExtent(farmSource.getExtent(), size);
		}

		var select = new ol.interaction.Select({
			layers: function (layer) {
				var activeLayer = selectedLayer.value;
				return (activeLayer === 'farm' && layer === farmLayer) || (activeLayer === 'paddocks' && layer === paddocksLayer);
			},
			style: new ol.style.Style({
				fill: new ol.style.Fill({
					color: 'rgba(255, 255, 255, 0.6)'
				}),
				stroke: new ol.style.Stroke({
					color: '#ffcc33',
					width: 3
				})
			})
		});

		selectedLayer.addEventListener('change', function () {
			select.getFeatures().unselectAll();
		});

		var draw = new ol.interaction.Draw({
			source: paddocksSource,
			type: /** @type {ol.geom.GeometryType} */ 'Polygon'
		});

		var modify = new ol.interaction.Modify({
			features: select.getFeatures()
		});

		map.on('click', function (evt) {
			var activeLayer = selectedLayer.value;
			if ((paddocksSource.getFeaturesAtCoordinate(evt.coordinate).length > 0 && activeLayer === 'paddocks') ||
				(farmSource.getFeaturesAtCoordinate(evt.coordinate).length > 0 && activeLayer === 'farm')) {
				map.removeInteraction(draw);
				map.addInteraction(select);
				map.addInteraction(modify);
			} else {
				if (activeLayer === 'farm' || activeLayer === 'paddocks') {
					map.removeInteraction(select);
					map.removeInteraction(modify);
					map.addInteraction(draw);
				}
			}
		});

		//map.addInteraction(select);
		//map.addInteraction(modify);

		// shows data in textarea
		// replace this function by what you need
		saveData = function () {
			// define a format the data shall be converted to
			var format = new ol.format['GeoJSON'](),
			// this will be the data in the chosen format
				data;
			try {
				// convert the data of the vector_layer into the chosen format
				data = format.writeFeatures(vL.getSource().getFeatures());
			} catch (e) {
			}
			// format is JSON
			return JSON.stringify(data, null, 4);
		};

		window.onresize = function () {
			setTimeout(function () {
				var features = paddocksSource.getFeatures();
				//paddocksSource.clear();
				//paddocksSource.addFeatures(features);
				//gmap.setCenter(new google.maps.LatLng(view.getCenter()[0], view.getCenter()[1]));
				//gmap.setZoom(view.getZoom());
			}, 500);

		}

	};
var olMapDiv = document.getElementById('olmap'),
	map, saveData,
	initOlMap = function (data) {
		var view = new ol.View({
				rotation: 0,
				maxZoom: 21
			}),

			vS = new ol.source.GeoJSON(
				({
					"object": data,
					projection: 'EPSG:3857'
				})
			),

			vL = new ol.layer.Vector({
				source: vS,
				style: new ol.style.Style({
					fill: new ol.style.Fill({
						color: 'rgba(255, 255, 255, 0.4)'
					}),
					stroke: new ol.style.Stroke({
						color: '#319FD3',
						width: 1
					})
				})
			});

		map = new ol.Map({
			layers: [vL],
			target: olMapDiv,
			view: view,
			interactions: ol.interaction.defaults({
				altShiftDragRotate: false,
				dragPan: false,
				rotate: false
			}).extend([new ol.interaction.DragPan({kinetic: null})]),
			controls: ol.control.defaults({
				attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
					collapsible: false
				})
			}).extend([
				new ol.control.ZoomToExtent({
					extent: vS.getExtent()
				}),
				new ol.control.ScaleLine(),
				new DrawControl()
			])
		});

		var feature = vS.getFeatures()[0],

			polygon = /** @type {ol.geom.SimpleGeometry} */ (feature.getGeometry()),

			size = /** @type {ol.Size} */ (map.getSize());

		view.on('change:center', function () {
			var center = ol.proj.transform(view.getCenter(), 'EPSG:3857', 'EPSG:4326');
			gmap.setCenter(new google.maps.LatLng(center[1], center[0]));
		});

		view.on('change:resolution', function () {
			gmap.setZoom(view.getZoom());
		});

		view.fitGeometry(polygon, size);

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
		}

	};
//    proj4.defs("EPSG:3111", "+proj=lcc +lat_1=-36 +lat_2=-38 +lat_0=-37 +lon_0=145 +x_0=2500000 +y_0=2500000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");

//    var projection = ol.proj.get('EPSG:3111');

var gmap = new google.maps.Map(document.getElementById('gmap'), {
		disableDefaultUI: true,
		keyboardShortcuts: false,
		draggable: false,
		disableDoubleClickZoom: true,
		scrollwheel: false,
		streetViewControl: false
	}),

	view = new ol.View({
		rotation: 0,
		maxZoom: 21
	}),

	data = farmData(),

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
				color: 'rgba(255, 255, 255, 0.6)'
			}),
			stroke: new ol.style.Stroke({
				color: '#319FD3',
				width: 1
			})
		})
	}),

	mousePositionControl = new ol.control.MousePosition({
		coordinateFormat: ol.coordinate.createStringXY(4),
		projection: 'EPSG:4326',
		// comment the following two lines to have the mouse position
		// be placed within the map.
		className: 'custom-mouse-position',
		target: document.getElementById('mouse-position'),
		undefinedHTML: '&nbsp;'
	}),

	olMapDiv = document.getElementById('olmap'),

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
			new ol.control.FullScreen(),
			mousePositionControl
		])
	}),

	feature = vS.getFeatures()[0],

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

olMapDiv.parentNode.removeChild(olMapDiv);
gmap.controls[google.maps.ControlPosition.TOP_LEFT].push(olMapDiv);
var deselectFeatures, initDrawModify = function() {
	map.on('click', function (evt) {
		var activeLayer = selectedLayer.value;
		if ((paddocksSource.getFeaturesAtCoordinate(evt.coordinate).length > 0 && activeLayer === 'paddocks') ||
			(farmSource.getFeaturesAtCoordinate(evt.coordinate).length > 0 && activeLayer === 'farm')) {
			drawPaddock.disable();
			modifyPaddock.enable();
		} else if (activeLayer === 'farm' || activeLayer === 'paddocks') {
			modifyPaddock.disable();
			drawPaddock.enable();
		} else {
			modifyPaddock.disable();
			drawPaddock.disable();
		}
	});

	// Deselect selected features
	deselectFeatures = function deselectFeatures() {
		featureOverlay.getFeatures().clear()
	}

// The features are not added to a regular vector layer/source,
// but to a feature overlay which holds a collection of features.
// This collection is passed to the modify and also the draw
// interaction, so that both can add or modify features.
	var featureOverlay = new ol.FeatureOverlay({
		features: paddocksSource.getFeatures(),
		style: new ol.style.Style({
			fill: new ol.style.Fill({
				color: 'rgba(255, 255, 255, 0.2)'
			}),
			stroke: new ol.style.Stroke({
				color: '#ffcc33',
				width: 2
			}),
			image: new ol.style.Circle({
				radius: 7,
				fill: new ol.style.Fill({
					color: '#ffcc33'
				})
			})
		}),
		map: map
	});

	featureOverlay.addFeature(farmSource.getFeatures()[0]);

	var modifyPaddock = function () {
		var select = new ol.interaction.Select(),
			modify = new ol.interaction.Modify({
				features: select.getFeatures()
			});

		function _init() {
			map.addInteraction(select);
			map.addInteraction(modify);

			setEvents();
		}

		function _enable() {
			select.setActive(true);
			modify.setActive(true);
		}

		function _disable() {
			select.setActive(false);
			modify.setActive(false);
		}

		function setEvents() {
			var selectedFeatures = select.getFeatures();

			select.on('change:active', function () {
				selectedFeatures.forEach(selectedFeatures.remove, selectedFeatures);
			});
		}

		return {
			init: _init,
			enable: _enable,
			disable: _disable
		}
	}();


	var drawPaddock = function () {
		var draw = new ol.interaction.Draw({
			features: featureOverlay.getFeatures(),
			type: /** @type {ol.geom.GeometryType} */ ('Polygon')
		});

		function _init() {
			map.addInteraction(draw);
			draw.setActive(false);
		}

		function _enable() {
			draw.setActive(true);
		}

		function _disable() {
			draw.setActive(false);
		}

		return {
			init: _init,
			enable: _enable,
			disable: _disable
		}
	}();

	var snap = new ol.interaction.Snap({
		features: featureOverlay.getFeatures()
	});


	modifyPaddock.init();
	drawPaddock.init();
	map.addInteraction(snap);
	drawPaddock.disable();
	modifyPaddock.disable();
}
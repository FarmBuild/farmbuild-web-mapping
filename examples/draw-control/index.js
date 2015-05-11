/**
 * @constructor
 * @extends {ol.control.Control}
 * @param {Object=} opt_options Control options.
 */
var DrawControl = function (opt_options) {

	var options = opt_options || {};

	var button = document.createElement('button');
	button.innerHTML = 'D';

	var this_ = this;
	var enableDrawing = function (e) {
		this_.getMap().getView().setRotation(0);
	};

	button.addEventListener('click', enableDrawing, false);
	button.addEventListener('touchstart', enableDrawing, false);

	var element = document.createElement('div');
	element.className = 'draw-control ol-unselectable ol-control';
	element.appendChild(button);

	ol.control.Control.call(this, {
		element: element,
		target: options.target
	});

},

// The features are not added to a regular vector layer/source,
// but to a feature overlay which holds a collection of features.
// This collection is passed to the modify and also the draw
// interaction, so that both can add or modify features.
	featureOverlay = new ol.FeatureOverlay({
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
		})
	}),
	modify = new ol.interaction.Modify({
		features: featureOverlay.getFeatures(),
		// the SHIFT key must be pressed to delete vertices, so
		// that new vertices can be drawn at the same position
		// of existing vertices
		deleteCondition: function (event) {
			return ol.events.condition.shiftKeyOnly(event) &&
				ol.events.condition.singleClick(event);
		}
	}),
	draw = new ol.interaction.Draw({
		features: featureOverlay.getFeatures(),
		type: /** @type {ol.geom.GeometryType} */ 'Polygon'
	}),

	initDrawControl = function(map){
		map.addInteraction(modify);
		map.addInteraction(draw);
		featureOverlay.setMap(map);
	};

ol.inherits(DrawControl, ol.control.Control);


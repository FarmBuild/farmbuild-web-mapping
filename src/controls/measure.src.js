'use strict';

angular.module('farmbuild.webmapping')
	.factory('webMappingMeasureControl',
	function (validations,
	          webMappingMeasurement,
	          $rootScope,
	          $log) {
		var _isDefined = validations.isDefined,
			_measurement = webMappingMeasurement;

		function _create(map, type) {
			var source = new ol.source.Vector(),
				baseCssClass = 'measure ol-unselectable ol-control ',

				drawInteraction = new ol.interaction.Draw({
					source: source,
					type: /** @type {ol.geom.GeometryType} */ (type),
					style: new ol.style.Style({
						fill: new ol.style.Fill({
							color: 'rgba(255, 255, 255, 0.2)'
						}),
						stroke: new ol.style.Stroke({
							color: 'rgba(0, 0, 0, 0.5)',
							lineDash: [10, 10],
							width: 2
						}),
						image: new ol.style.Circle({
							radius: 5,
							stroke: new ol.style.Stroke({
								color: 'rgba(0, 0, 0, 0.7)'
							}),
							fill: new ol.style.Fill({
								color: 'rgba(255, 255, 255, 0.2)'
							})
						})
					})
				});

			var letter, cssClass, options = {};
			if (type == 'Polygon') {
				letter = "A";
				cssClass = 'area';
			} else {
				letter = "L";
				cssClass = 'length'
			}

			drawInteraction.on('drawend',
				function (evt) {
					// unset sketch
					if (type == 'Polygon') {
						$rootScope.$broadcast('web-mapping-measure-end', {value: _measurement.area(evt.feature), unit: 'hectares'});
					} else {
						$rootScope.$broadcast('web-mapping-measure-end', {value: _measurement.length(evt.feature), unit: 'metres'});

					}
					drawInteraction.setActive(false);
					document.getElementsByClassName(baseCssClass + cssClass)[0].className = (baseCssClass + cssClass);
				}, this);


			map.addInteraction(drawInteraction);
			drawInteraction.setActive(false);

			/**
			 * @constructor
			 * @extends {ol.control.Control}
			 * @param {Object=} opt_options Control options.
			 */
			function _measureControl(type) {

				var button = document.createElement('button');
				button.innerHTML = letter;

				var handleMeasure = function (e) {
					drawInteraction.setActive(!drawInteraction.getActive());
					element.className = baseCssClass + cssClass + (drawInteraction.getActive() ? ' active': '');
					$rootScope.$broadcast('web-mapping-measure-start')
				};

				button.addEventListener('click', handleMeasure, false);
				button.addEventListener('touchstart', handleMeasure, false);

				var element = document.createElement('div');
				element.className = baseCssClass + cssClass;
				element.title = 'Measure ' + cssClass;
				element.appendChild(button);

				ol.control.Control.call(this, {
					element: element,
					target: options.target
				});
			}

			ol.inherits(_measureControl, ol.control.Control);

			return (new _measureControl(type));

		};


		return {
			create: _create
		}

	});

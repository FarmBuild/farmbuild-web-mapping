var MERGE, REMOVE, CLIP, AREA;

angular.module('farmbuild.webmapping')
	.factory('openlayersDraw',
	function (validations,
	          $log) {
		var _isDefined = validations.isDefined,
			_draw, _modify, _select, _snap, _layer, _source, _init = function (layer, map) {
			var selectedLayer = document.getElementById('layers');
			if (!_isDefined(layer)) {
				return;
			}
			_layer = layer;
			_source = layer.getSource();
			map.on('click', function (evt) {
				var activeLayer = selectedLayer.value;
				if (!(activeLayer === 'farm' || activeLayer === 'paddocks')) {
					modify.disable();
					draw.disable();
					return;
				}
				if (_source.getFeaturesAtCoordinate(evt.coordinate).length > 0) {
					draw.disable();
					modify.enable();
				} else {
					modify.disable();
					draw.enable();
				}
			});

			// Remove all interactions of map
			function _removeInteractions() {
				map.getInteractions().clear();
				map.addInteraction(new ol.interaction.DragPan({kinetic: null}));
			};


			_removeInteractions(map);

			if (!_isDefined(_source)) {
				_source = new ol.source.Vector({
					features: []
				});
			}

			var modify = function () {
				_select = new ol.interaction.Select({
					addCondition: ol.events.condition.shiftKeyOnly,
					layers: [layer]
				});
				_modify = new ol.interaction.Modify({
					features: _select.getFeatures()
				});

				function _init() {
					map.addInteraction(_select);
					map.addInteraction(_modify);

					setEvents();
				}

				function _enable() {
					_select.setActive(true);
					_modify.setActive(true);
				}

				function _disable() {
					_select.setActive(false);
					_modify.setActive(false);
				}

				function setEvents() {
					var selectedFeatures = _select.getFeatures();

					_select.on('change:active', function () {
						selectedFeatures.forEach(selectedFeatures.remove, selectedFeatures);
					});
				};


				return {
					init: _init,
					enable: _enable,
					disable: _disable
				}
			}();


			var draw = function () {
				_draw = new ol.interaction.Draw({
					source: _source,
					type: /** @type {ol.geom.GeometryType} */ ('Polygon')
				});

				function _init() {
					map.addInteraction(_draw);
					_draw.setActive(false);
				}

				function _enable() {
					_draw.setActive(true);
				}

				function _disable() {
					_draw.setActive(false);
				}

				return {
					init: _init,
					enable: _enable,
					disable: _disable
				}
			}();

			_snap = new ol.interaction.Snap({
				source: _source
			});


			modify.init();
			draw.init();
			map.addInteraction(_snap);
			draw.disable();
			modify.disable();
		};

		function _merge(){
			var format = new ol.format['GeoJSON'](),
			// this will be the data in the chosen format
				data,
				featuresToMerge = _select.getFeatures().getArray(),
				merged;
			_removeFeatures(featuresToMerge, _layer);
			data = angular.fromJson(format.writeFeatures(featuresToMerge));
			merged = turf.merge(data);
			_source.addFeature(new ol.Feature({
				geometry: new ol.geom.Polygon(merged.geometry.coordinates)
			}));
			_select.getFeatures().clear();
		};

		function _clip(){
			var format = new ol.format['GeoJSON'](),
			// this will be the data in the chosen format
				data,
				featuresToClip = _select.getFeatures().getArray(),
				f1, f2;

			_layer.getSource().removeFeature(featuresToClip[0]);

			data = angular.fromJson(format.writeFeatures(featuresToClip)).features;
			f1 = turf.erase(data[0], data[1]);
			//f2 = turf.erase(data[1], data[0]);
			_source.addFeature(new ol.Feature({
				geometry: new ol.geom.Polygon(f1.geometry.coordinates)
			}));
			//_source.addFeature(new ol.Feature({
			//	geometry: new ol.geom.Polygon(f2.geometry.coordinates)
			//}));
			_select.getFeatures().clear();
		};

		function _area(){
			var format = new ol.format['GeoJSON'](),
			// this will be the data in the chosen format
				features,
				olFeatures = _select.getFeatures().getArray();

			features = angular.fromJson(format.writeFeatures(olFeatures));
			return turf.area(features) * 0.0001;
		};

		function _removeFeatures(features, layer) {
			if (_isDefined(features)) {
				angular.forEach(features, function(feature){
					layer.getSource().removeFeature(feature);
				});
			}
		};

		function _remove(){
			var featuresToRemove = _select.getFeatures().getArray();
			_removeFeatures(featuresToRemove, _layer);
			_select.getFeatures().clear();
		};

		MERGE = _merge;
		REMOVE = _remove;
		CLIP = _clip;
		AREA = _area;

		return {
			init: _init,
			merge: _merge,
			remove: _remove,
			clip: _clip,
			area: _area
		}

	});
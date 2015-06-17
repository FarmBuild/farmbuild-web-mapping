'use strict';

/**
 * webmapping openlayers helper
 * @type {object}
 * @namespace webmapping.olHelper
 */

angular.module('farmbuild.webmapping')
	.factory('webMappingOpenLayersHelper',
	function (validations,
	          webMappingMeasureControl,
	          webMappingSnapControl,
	          webMappingGoogleAddressSearch,
	          webMappingLayerSwitcherControl,
	          webMappingTransformation,
	          webMappingConverter,
	          $log) {
		var _isDefined = validations.isDefined,
			_googleProjection = 'EPSG:3857',
			_ZoomToExtentControl,
			_transform = webMappingTransformation,
			_converter = webMappingConverter;

		function addControlsToGmap(gmap, targetElement) {
			gmap.controls[google.maps.ControlPosition.TOP_LEFT].push(targetElement);
			targetElement.parentNode.removeChild(targetElement);
		}

		function addControlsToOlMap(map, extent, dataProjection) {
			if (extent) {
				_ZoomToExtentControl = new ol.control.ZoomToExtent({
					extent: extent
				});
				map.addControl(_ZoomToExtentControl);
			}
			map.addControl(new ol.control.ScaleLine());
			map.addControl(new webMappingMeasureControl.create(map, 'Polygon', dataProjection));
			map.addControl(new webMappingMeasureControl.create(map, 'LineString', dataProjection));
			map.addControl(new webMappingSnapControl.create());
			map.addControl(new ol.control.LayerSwitcher({
				tipLabel: 'Switch on/off farm layers'
			}));
		}

		/**
		 * initialise webmapping and integrate with google maps
		 * @method initWithGoogleMap
		 * @param {!ol.Map} map openlayers map object
		 * @param {!string} dataProjection - data projection code
		 * @param {!ol.Extent} extent - extent of the farm to initialise the map
		 * @param {!object} gmap - google map object to integarte with
		 * @param {!object} targetElement - openlayers map html element
		 * @memberof webmapping.olHelper
		 */
		function _initWithGoogleMap(map, dataProjection, extent, gmap, targetElement) {
			if (!_isDefined(gmap) || !_isDefined(map) || !_isDefined(dataProjection)) {
				return;
			}
			$log.info('integrating google map ...');
			var view = map.getView();
			view.on('change:center', function () {
				var center = ol.proj.transform(view.getCenter(), _googleProjection, dataProjection);
				gmap.setCenter(new google.maps.LatLng(center[1], center[0]));
			});

			view.on('change:resolution', function () {
				gmap.setZoom(view.getZoom());
			});

			// Google Map and vector layers go out of sync when window is resized.
			window.onresize = function () {
				var center = _transform.toGoogleLatLng(view.getCenter(), dataProjection);
				google.maps.event.trigger(gmap, "resize");
				gmap.setCenter(center);
			};
			_init(map, dataProjection, extent);
			addControlsToGmap(gmap, targetElement);
		};

		/**
		 * initialise webmapping
		 * @method init
		 * @param {!ol.Map} map openlayers map object
		 * @param {!string} dataProjection - data projection code
		 * @param {!ol.Extent} extent - extent of the farm to initialise the map
		 * @memberof webmapping.olHelper
		 */
		function _init(map, dataProjection, extent) {
			var defaults = {
				centerNew: [-36.22488327137526, 145.5826132801325],
				zoomNew: 6
			};
			var view = map.getView();
			$log.info('farm extent: %j', extent);

			if (extent[0] === Infinity) {
				view.setCenter(ol.proj.transform([defaults.centerNew[1], defaults.centerNew[0]],
					dataProjection, _googleProjection));
				view.setZoom(defaults.zoomNew);
			} else {
				view.fitExtent(extent, map.getSize());
			}
			addControlsToOlMap(map, extent, dataProjection);
		}

		/**
		 * Exports farm geometry
		 * @method exportGeometry
		 * @returns {object} object containing farm and paddocks geometry
		 * @param {!ol.source.Vector} source openlayers map object
		 * @param {!string} dataProjection - data projection code
		 * @param {!string} featureProjection - feature projection code
		 * @memberof webmapping.olHelper
		 */
		function _exportGeometry(source, dataProjection, featureProjection) {
			if (!_isDefined(source)) {
				return;
			}
			var format = new ol.format['GeoJSON']();
			try {
				var result = format.writeFeaturesObject(source.getFeatures(), {
					dataProjection: dataProjection,
					featureProjection: featureProjection
				});
				angular.forEach(result.features, function (feature) {
					feature.geometry.crs = {
						properties: {
							name: dataProjection
						}
					}
				});
				return result;
			} catch (e) {
				$log.error(e);
			}
		};

		function _center(coordinates, map) {
			if (!_isDefined(coordinates) || !_isDefined(map)) {
				return;
			}
			$log.info('centring view ...');
			map.getView().setCenter(coordinates);
			map.getView().setZoom(15);
		};

		function _createPaddocksLayer(paddocksGeometry, dataProjection, featureProjection) {
			if (!_isDefined(paddocksGeometry) || !_isDefined(dataProjection) || !_isDefined(featureProjection)) {
				return;
			}
			$log.info('creating paddocks vector layer ...', dataProjection, featureProjection);
			var paddocksSource = new ol.source.Vector({
				features: (new ol.format.GeoJSON()).readFeatures(paddocksGeometry, {
					dataProjection: dataProjection,
					featureProjection: featureProjection
				})
			});

			return new ol.layer.Vector({
				source: paddocksSource,
				title: 'Paddocks',
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

		function _createFarmLayer(farmGeometry, dataProjection, featureProjection) {
			if (!_isDefined(farmGeometry) || !_isDefined(dataProjection) || !_isDefined(featureProjection)) {
				return;
			}
			$log.info('creating farm vector layer ...', dataProjection, featureProjection);
			var farmSource = new ol.source.Vector({
				features: (new ol.format.GeoJSON()).readFeatures(farmGeometry, {
					dataProjection: dataProjection,
					featureProjection: featureProjection
				})
			});

			return new ol.layer.Vector({
				source: farmSource,
				title: 'Farm',
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
		};

		/**
		 * Creates farm layerGroup
		 * @method createFarmLayers
		 * @returns {ol.layer.Group} object containing farm and paddocks geometry
		 * @param {!object} geometry farmGeometry
		 * @param {!string} dataProjection - data projection code
		 * @param {!string} featureProjection - feature projection code
		 * @memberof webmapping.olHelper
		 */
		function _createFarmLayers(geometry, dataProjection, featureProjection) {
			return new ol.layer.Group({
				'title': 'Farm layers',
				layers: [
					_createPaddocksLayer(geometry.paddocks, dataProjection, featureProjection),
					_createFarmLayer(geometry.farm, dataProjection, featureProjection)
				]
			})
		}

		/**
		 * Creates base layers layerGroup - to get base layers with google map layers use: createBaseLayersWithGoogleMaps
		 * @method createBaseLayers
		 * @returns {ol.layer.Group} object containing farm and paddocks geometry
		 * @memberof webmapping.olHelper
		 */
		function _createBaseLayers() {
			var vicMapImageryLayer = new ol.layer.Tile({
					title: 'VicMAP Imagery',
					type: 'base',
					visible: true,
					source: new ol.source.TileWMS({
						url: 'http://api.maps.vic.gov.au/vicmapapi-mercator/map-wm/wms',
						params: {LAYERS: 'SATELLITE_WM', VERSION: '1.1.1'}
					})
				}),
				vicMapStreetLayer = new ol.layer.Tile({
					title: 'VicMAP Street',
					type: 'base',
					visible: false,
					source: new ol.source.TileWMS({
						url: 'http://api.maps.vic.gov.au/vicmapapi-mercator/map-wm/wms',
						params: {LAYERS: 'WEB_MERCATOR', VERSION: '1.1.1'}
					})
				});

			return new ol.layer.Group({
				'title': 'Base maps',
				layers: [vicMapImageryLayer, vicMapStreetLayer]
			})
		};

		/**
		 * Creates base layers layerGroup - to get base layers without google map layers use: createBaseLayers
		 * @method createBaseLayersWithGoogleMaps
		 * @returns {ol.layer.Group} object containing farm and paddocks geometry
		 * @memberof webmapping.olHelper
		 */
		function _createBaseLayersWithGoogleMaps() {
			var vicMapImageryLayer = new ol.layer.Tile({
					title: 'VicMAP Imagery',
					type: 'base',
					visible: false,
					source: new ol.source.TileWMS({
						url: 'http://api.maps.vic.gov.au/vicmapapi-mercator/map-wm/wms',
						params: {LAYERS: 'SATELLITE_WM', VERSION: '1.1.1'}
					})
				}),
				vicMapStreetLayer = new ol.layer.Tile({
					title: 'VicMAP Street',
					type: 'base',
					visible: false,
					source: new ol.source.TileWMS({
						url: 'http://api.maps.vic.gov.au/vicmapapi-mercator/map-wm/wms',
						params: {LAYERS: 'WEB_MERCATOR', VERSION: '1.1.1'}
					})
				}),
				googleImageryLayer = new ol.layer.Tile({
					title: 'Google Imagery',
					type: 'base',
					visible: true
				}),
				googleStreetLayer = new ol.layer.Tile({
					title: 'Google Street',
					type: 'base',
					visible: false
				});

			return new ol.layer.Group({
				'title': 'Base maps',
				layers: [vicMapImageryLayer, vicMapStreetLayer, googleStreetLayer, googleImageryLayer]
			})
		};

		/**
		 * Reloads the farm layers
		 * @method reload
		 * @param {!ol.Map} map openlayers map object
		 * @param {!object} geoJsons object that containts farm and paddocks geometry to reload from
		 * @param {!string} dataProjection - data projection code
		 * @param {!string} featureProjection - feature projection code
		 * @memberof webmapping.olHelper
		 */
		function _reload(map, geoJsons, dataProjection, featureProjection) {
			var farmLayers = map.getLayers().item(1).getLayers(),
				farmSource = farmLayers.item(1).getSource(),
				paddocksSource = farmLayers.item(0).getSource(),
				farmFeatures = _converter.geoJsonToFeatures(geoJsons.farm, dataProjection, featureProjection),
				paddockFeatures = _converter.geoJsonToFeatures(geoJsons.paddocks, dataProjection, featureProjection);
			farmSource.clear();
			paddocksSource.clear();
			farmSource.addFeatures(farmFeatures);
			paddocksSource.addFeatures(paddockFeatures);
		};

		/**
		 * Initialises google address search and creates a autocomplete for given text input.
		 * @method initGoogleAddressSearch
		 * @param {!object} textInputElement Text input dom element which is used to show autocomplete
		 * @param {!ol.Map} olmap object to interact with when user chooses a location from autocomplete
		 * @memberof webmapping.olHelper
		 */
		function _initGoogleAddressSearch(textInputElement, olmap) {
			if (!_isDefined(textInputElement) || !_isDefined(olmap)) {
				return;
			}
			$log.info('init google address search ...', textInputElement);
			function onPlaceChanged(latLng) {
				latLng = _transform.fromGoogleLatLng(latLng);
				_center(latLng, olmap);
			}

			webMappingGoogleAddressSearch.init(textInputElement, onPlaceChanged);
		};

		/**
		 * Updates the extent of ZoomToExtent control, call this method after a change to farm boundaries.
		 * @method updateZoomToExtent
		 * @memberof webmapping.olHelper
		 */
		function _updateZoomToExtent() {
			var map;
			if (!_isDefined(_ZoomToExtentControl)) {
				return;
			}
			map = _ZoomToExtentControl.getMap();
			map.removeControl(_ZoomToExtentControl);
			_ZoomToExtentControl = new ol.control.ZoomToExtent({
				extent: map.getLayers().item(1).getLayers().item(1).getSource().getExtent()
			});
			map.addControl(_ZoomToExtentControl);
		};

		function _farmLayer(map) {
			if (!_isDefined(map) || !_isDefined(map.getLayers().item(1)) || !_isDefined(map.getLayers().item(1).getLayers() || !_isDefined(map.getLayers().item(1).getLayers().getLength() === 2))) {
				return;
			}
			return map.getLayers().item(1).getLayers().item(1);
		};

		function _paddocksLayer(map) {
			if (!_isDefined(map) || !_isDefined(map.getLayers().item(1)) || !_isDefined(map.getLayers().item(1).getLayers() || !_isDefined(map.getLayers().item(1).getLayers().getLength() === 2))) {
				return;
			}
			return map.getLayers().item(1).getLayers().item(0);
		};

		function _farmLayerGroup(map) {
			if (!_isDefined(map) || !_isDefined(map.getLayers().item(1))) {
				return;
			}
			return map.getLayers().item(1);
		};

		return {
			init: _init,
			exportGeometry: _exportGeometry,
			center: _center,
			initWithGoogleMap: _initWithGoogleMap,
			createFarmLayers: _createFarmLayers,
			createBaseLayers: _createBaseLayers,
			createBaseLayersWithGoogleMaps: _createBaseLayersWithGoogleMaps,
			farmLayer: _farmLayer,
			paddocksLayer: _paddocksLayer,
			farmLayerGroup: _farmLayerGroup,
			reload: _reload,
			initGoogleAddressSearch: _initGoogleAddressSearch,
			updateExtent: _updateZoomToExtent
		}

	});

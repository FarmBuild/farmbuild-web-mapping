'use strict';

angular.module('farmbuild.webmapping')
	.factory('webMappingOpenLayersHelper',
	function (validations,
	          webMappingMeasureControl,
	          webMappingSnapControl,
	          webMappingGoogleAddressSearch,
	          $log) {
		var _isDefined = validations.isDefined,
			_geoJSONFormat = new ol.format['GeoJSON'](),
			_googleProjection = 'EPSG:3857',
			_openLayersDefaultProjection = 'EPSG:4326',
			_extentControl;

		function _transformToGoogleLatLng(latLng, destinationProjection) {
			if (!_isDefined(latLng) || !_isDefined(destinationProjection)) {
				return;
			}
			var transformed = ol.proj.transform(latLng, _googleProjection, destinationProjection);
			return new google.maps.LatLng(transformed[1], transformed[0])
		};

		function _transformFromGoogleLatLng(latLng) {
			if (!_isDefined(latLng)) {
				return;
			}
			return ol.proj.transform([latLng.lng(), latLng.lat()], _openLayersDefaultProjection, _googleProjection);
		};

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

		function _clear(farmSource, paddocksSource) {
			if (!_isDefined(farmSource) || !_isDefined(paddocksSource)) {
				return;
			}
			$log.info('clearing source ...');
			paddocksSource.clear();
			farmSource.clear();
		};

		function addControls(map) {
			if(_isDefined(_extentControl)) {
				map.addControl(_extentControl);
			}
			map.addControl(new ol.control.ScaleLine());
			map.addControl(new webMappingMeasureControl.create(map, 'Polygon'));
			map.addControl(new webMappingMeasureControl.create(map, 'LineString'));
			map.addControl(new webMappingSnapControl.create());
			map.addControl(new ol.control.LayerSwitcher({
				tipLabel: 'Switch on/off farm layers'
			}));
		}

		function _integrateGMap(gmap, map, dataProjection) {
			if (!_isDefined(gmap) || !_isDefined(map) || !_isDefined(dataProjection)) {
				return;
			}
			$log.info('integrating google map ...');
			var view = map.getView(),
				targetElement = map.getTargetElement();
			view.on('change:center', function () {
				var center = ol.proj.transform(view.getCenter(), _googleProjection, dataProjection);
				gmap.setCenter(new google.maps.LatLng(center[1], center[0]));
			});

			view.on('change:resolution', function () {
				gmap.setZoom(view.getZoom());
			});

			// Google Map and vector layers go out of sync when window is resized.
			window.onresize = function () {
				var center = _transformToGoogleLatLng(view.getCenter(), dataProjection);
				google.maps.event.trigger(gmap, "resize");
				gmap.setCenter(center);
			};

			var defaults = {
				centerNew: [-36.22488327137526, 145.5826132801325],
				zoomNew: 6
			}
			var extent = map.getLayers().item(1).getLayers().item(1).getSource().getExtent();

			$log.info('farm extent: %j', extent);

			if (extent[0] === Infinity) {
				gmap.controls[google.maps.ControlPosition.TOP_LEFT].push(targetElement);
				targetElement.parentNode.removeChild(targetElement);
				view.setCenter(ol.proj.transform([defaults.centerNew[1], defaults.centerNew[0]],
					dataProjection, _googleProjection));
				view.setZoom(defaults.zoomNew);
				addControls(map);
				return;
			}

			gmap.controls[google.maps.ControlPosition.TOP_LEFT].push(targetElement);
			targetElement.parentNode.removeChild(targetElement);
			_extentControl = new ol.control.ZoomToExtent({
				extent: map.getLayers().item(1).getLayers().item(1).getSource().getExtent()
			});
			addControls(map);
			view.fitExtent(extent, map.getSize());
		};

		function _center(coordinates, map) {
			if (!_isDefined(coordinates) || !_isDefined(map)) {
				return;
			}
			$log.info('centring view ...');
			map.getView().setCenter(coordinates);
			map.getView().setZoom(15);
		};

		function _paddocksLayer(paddocksGeometry, dataProjection, featureProjection) {
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

		function _farmLayer(farmGeometry, dataProjection, featureProjection) {
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

		function _reload(map, geoJson, dataProjectionCode, featureProjectionCode) {
			var layers = map.getLayers();
			layers.clear();
			map.addLayer(_paddocksLayer(geoJson.paddocks, dataProjectionCode, featureProjectionCode));
			map.addLayer(_farmLayer(geoJson.farm, dataProjectionCode, featureProjectionCode));
		};

		function _openLayerFeatureToGeoJson(olFeature, dataProjection, featureProjection) {
			if (!_isDefined(olFeature)) {
				return;
			}
			$log.info('Converting openlayer feature to geoJson ...', olFeature);
			return _geoJSONFormat.writeFeatureObject(olFeature, {
				dataProjection: dataProjection,
				featureProjection: featureProjection
			});
		};

		function _openLayerFeaturesToGeoJson(olFeatures, dataProjection, featureProjection) {
			if (!_isDefined(olFeatures)) {
				return;
			}
			$log.info('Converting openlayer feature to geoJson ...', olFeatures);
			return _geoJSONFormat.writeFeaturesObject(olFeatures, {
				dataProjection: dataProjection,
				featureProjection: featureProjection
			});
		};

		function _geoJsonToOpenLayerFeature(feature, dataProjection, featureProjection) {
			if (!_isDefined(feature)) {
				return;
			}
			$log.info('Converting geoJson feature to openlayer feature ...', feature);
			return _geoJSONFormat.readFeature(feature, {
				dataProjection: dataProjection,
				featureProjection: featureProjection
			});
		};

		function _geoJsonToOpenLayerFeatures(features, dataProjection, featureProjection) {
			if (!_isDefined(features)) {
				return;
			}
			$log.info('Converting geoJson feature to openlayer features ...', features);
			return _geoJSONFormat.readFeatures(features, {
				dataProjection: dataProjection,
				featureProjection: featureProjection
			});
		};

		function _initAddressSearch(targetElementId, olmap) {
			if (!_isDefined(targetElementId) || !_isDefined(olmap)) {
				return;
			}
			$log.info('init google address search ...', targetElementId);
			function onPlaceChanged(latLng) {
				var latLng = _transformFromGoogleLatLng(latLng);
				_center(latLng, olmap);
			}

			webMappingGoogleAddressSearch.init(targetElementId, onPlaceChanged);
		};

		function _updateExtent(map) {
			if(_isDefined(_extentControl)) {
				map.removeControl(_extentControl);
			}
			_extentControl = new ol.control.ZoomToExtent({
				extent: map.getLayers().item(1).getLayers().item(1).getSource().getExtent()
			});
			map.addControl(_extentControl);
		};

		return {
			exportGeometry: _exportGeometry,
			clear: _clear,
			center: _center,
			integrateGMap: _integrateGMap,
			paddocksLayer: _paddocksLayer,
			farmLayer: _farmLayer,
			reload: _reload,
			featureToGeoJson: _openLayerFeatureToGeoJson,
			featuresToGeoJson: _openLayerFeaturesToGeoJson,
			geoJsonToFeature: _geoJsonToOpenLayerFeature,
			geoJsonToFeatures: _geoJsonToOpenLayerFeatures,
			transformFromGoogleLatLng: _transformFromGoogleLatLng,
			transformToGoogleLatLng: _transformToGoogleLatLng,
			initAddressSearch: _initAddressSearch,
			updateExtent: _updateExtent
		}

	});

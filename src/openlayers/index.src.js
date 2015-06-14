'use strict';

angular.module('farmbuild.webmapping')
    .factory('webMappingOpenLayersHelper',
    function (validations,
              webMappingMeasureControl,
              webMappingSnapControl,
              webMappingGoogleAddressSearch,
              webMappingLayerSwitcherControl,
              webMappingTransformation,
              $log) {
        var _isDefined = validations.isDefined,
            _googleProjection = 'EPSG:3857',
            _extentControl,
            _transform = webMappingTransformation;

        function _init(gmap, map, dataProjection, targetElement, init, extent) {
            var defaults = {
                centerNew: [-36.22488327137526, 145.5826132801325],
                zoomNew: 6
            };
            var view = map.getView();
            $log.info('farm extent: %j', extent);

            if (extent[0] === Infinity) {
                gmap.controls[google.maps.ControlPosition.TOP_LEFT].push(targetElement);
                targetElement.parentNode.removeChild(targetElement);
                view.setCenter(ol.proj.transform([defaults.centerNew[1], defaults.centerNew[0]],
                    dataProjection, _googleProjection));
                view.setZoom(defaults.zoomNew);
                if (init) {
                    addControls(map);
                }
                return;
            }

            gmap.controls[google.maps.ControlPosition.TOP_LEFT].push(targetElement);
            targetElement.parentNode.removeChild(targetElement);
            if (init) {
                addControls(map, extent);
            }
            view.fitExtent(extent, map.getSize());
        }

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

        function addControls(map, extent) {
            if (extent) {
                _extentControl = new ol.control.ZoomToExtent({
                    extent: extent
                });
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

        function _integrateGoogleMap(gmap, map, dataProjection, targetElement, init, extent) {
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
            _init(gmap, map, dataProjection, targetElement, init, extent);
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

        function _farmLayers(farmGeometry, paddocksGeometry, dataProjection, featureProjection) {
            return new ol.layer.Group({
                'title': 'Farm layers',
                layers: [
                    _paddocksLayer(paddocksGeometry, dataProjection, featureProjection),
                    _farmLayer(farmGeometry, dataProjection, featureProjection)
                ]
            })
        }

        function _baseLayers() {
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
        }

        function _reload(map, geoJson, dataProjectionCode, featureProjectionCode) {
            var layers = map.getLayers();
            layers.clear();
            map.addLayer(_paddocksLayer(geoJson.paddocks, dataProjectionCode, featureProjectionCode));
            map.addLayer(_farmLayer(geoJson.farm, dataProjectionCode, featureProjectionCode));
        };


        function _initGoogleAddressSearch(targetElementId, olmap) {
            if (!_isDefined(targetElementId) || !_isDefined(olmap)) {
                return;
            }
            $log.info('init google address search ...', targetElementId);
            function onPlaceChanged(latLng) {
                latLng = _transform.fromGoogleLatLng(latLng);
                _center(latLng, olmap);
            }

            webMappingGoogleAddressSearch.init(targetElementId, onPlaceChanged);
        };

        function _updateExtent(map) {
            if (_isDefined(_extentControl)) {
                map.removeControl(_extentControl);
            }
            _extentControl = new ol.control.ZoomToExtent({
                extent: map.getLayers().item(1).getLayers().item(1).getSource().getExtent()
            });
            map.addControl(_extentControl);
        };

        return {
            exportGeometry: _exportGeometry,
            center: _center,
            integrateGoogleMap: _integrateGoogleMap,
            farmLayers: _farmLayers,
            baseLayers: _baseLayers,
            reload: _reload,
            initGoogleAddressSearch: _initGoogleAddressSearch,
            updateExtent: _updateExtent
        }

    });

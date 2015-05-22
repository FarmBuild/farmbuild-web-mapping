"use strict";

angular.module("farmbuild.webmapping", [ "farmbuild.core", "farmbuild.farmdata" ]).factory("webmapping", function(farmdata, validations, $log, webMappingSession) {
    var _isDefined = validations.isDefined, webmapping;
    function _fromFarmData(farmData) {
        $log.info("Extracting farm and paddocks geometry from farmData ...");
        var farm = farmData.geometry, paddocks = [];
        if (!_isDefined(farmData.geometry) || !_isDefined(farmData.paddocks)) {
            return undefined;
        }
        angular.forEach(farmData.paddocks, function(val) {
            paddocks.push({
                type: "Feature",
                geometry: val.geometry
            });
        });
        return {
            farm: {
                type: "FeatureCollection",
                features: [ {
                    type: "Feature",
                    geometry: farm
                } ]
            },
            paddocks: {
                type: "FeatureCollection",
                features: paddocks
            }
        };
    }
    function _toFarmData(farmGeometry) {
        $log.info("Writing farm and paddocks geometry to farmData ...");
        var farm = data.geometry, paddocks = [];
        angular.forEach(data.paddocks, function(val) {
            paddocks.push(val.geometry);
        });
        return farmGeometry;
    }
    $log.info("Welcome to Web Mapping... " + "this should only be initialised once! why we see twice in the example?");
    function createDefault(farmData) {
        return _fromFarmData(farmData);
    }
    function _load(farmData) {
        var loaded = farmdata.load(farmData);
        if (!_isDefined(loaded)) {
            return undefined;
        }
        if (!loaded.hasOwnProperty("webMapping")) {
            loaded.webMapping = createDefault(farmData);
            loaded = farmdata.update(loaded);
        }
        return loaded;
    }
    function _exportFarmData(toExport) {
        if (!toExport) {
            return undefined;
        }
        return _toFarmData(toExport);
    }
    webmapping = {
        exportFarmData: _exportFarmData,
        load: _load
    };
    webmapping.version = "0.1.0";
    if (typeof window.farmbuild === "undefined") {
        window.farmbuild = {
            webmapping: webmapping
        };
    } else {
        window.farmbuild.webmapping = webmapping;
    }
    return webmapping;
});

"use strict";

angular.module("farmbuild.webmapping").factory("openLayers", function(validations, $log, openlayersDraw, googlemapslayer) {
    var defaults = {
        centerNew: [ -36.22488327137526, 145.5826132801325 ],
        zoomNew: 6
    }, _map, _paddocksLayer, _farmLayer, _size, _view, _paddocksSource, _farmSource, _targetElementId, _layerSelectionElementId, _isNew, _targetEl = document.getElementById("olmap"), _projection = "EPSG:4326", _isDefined = validations.isDefined;
    function _init(targetElementId, layerSelectionElementId, farmGeometry, paddocksGeometry) {
        var isNew;
        if (!_isDefined(farmGeometry)) {
            paddocksGeometry = {
                type: "FeatureCollection",
                features: []
            };
            farmGeometry = {
                type: "FeatureCollection",
                features: []
            };
            isNew = true;
        }
        _targetElementId = targetElementId;
        _layerSelectionElementId = layerSelectionElementId;
        _isNew = isNew;
        if (_isDefined(_map) && _map.setTarget) {
            _map.setTarget(null);
            _map = null;
        }
        var _layerSelectionElement = document.getElementById(layerSelectionElementId);
        proj4.defs("EPSG:4283", "+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs");
        var projection = ol.proj.get({
            code: "EPSG:4283"
        });
        _view = new ol.View({
            rotation: 0,
            projection: projection,
            maxZoom: 21
        });
        _paddocksSource = new ol.source.Vector({
            features: new ol.format.GeoJSON().readFeatures(paddocksGeometry, {
                dataProjection: "EPSG:4283",
                featureProjection: "EPSG:3857"
            })
        });
        _farmSource = new ol.source.Vector({
            features: new ol.format.GeoJSON().readFeatures(farmGeometry, {
                dataProjection: "EPSG:4283",
                featureProjection: "EPSG:3857"
            })
        });
        _paddocksLayer = new ol.layer.Vector({
            source: _paddocksSource,
            style: new ol.style.Style({
                fill: new ol.style.Fill({
                    color: "rgba(255, 255, 255, 0.3)"
                }),
                stroke: new ol.style.Stroke({
                    color: "#319FD3",
                    width: 1
                })
            })
        });
        _farmLayer = new ol.layer.Vector({
            source: _farmSource,
            style: new ol.style.Style({
                fill: new ol.style.Fill({
                    color: "rgba(255, 255, 255, 0)"
                }),
                stroke: new ol.style.Stroke({
                    color: "#ff6600",
                    width: 3
                })
            })
        });
        _map = new ol.Map({
            layers: [ _paddocksLayer, _farmLayer ],
            target: targetElementId,
            view: _view,
            interactions: ol.interaction.defaults({
                altShiftDragRotate: false,
                dragPan: false,
                rotate: false,
                mouseWheelZoom: true
            }).extend([ new ol.interaction.DragPan({
                kinetic: null
            }) ]),
            controls: ol.control.defaults({
                attributionOptions: {
                    collapsible: false
                }
            }).extend([ new ol.control.ZoomToExtent({
                extent: _farmSource.getExtent()
            }), new ol.control.ScaleLine() ])
        });
        _size = _map.getSize();
        _layerSelectionElement.addEventListener("change", function() {
            var layer;
            if (_layerSelectionElement.value === "paddocks") {
                layer = _paddocksLayer;
            }
            if (_layerSelectionElement.value === "farm") {
                layer = _farmLayer;
            }
            openlayersDraw.init(layer, _map);
        });
        return {
            map: _map,
            view: _view
        };
    }
    function _transform(latLng, sourceProjection, destinationProjection) {
        var transformed = ol.proj.transform(latLng, sourceProjection, destinationProjection);
        return new google.maps.LatLng(transformed[1], transformed[0]);
    }
    function _load(farmGeometry, paddocksGeometry) {
        return _init(_targetElementId, _layerSelectionElementId, farmGeometry, paddocksGeometry);
    }
    function _exportGeometry() {
        var format = new ol.format["GeoJSON"](), data;
        try {
            data = format.writeFeatures(_paddocksLayer.getSource().getFeatures());
        } catch (e) {}
        return JSON.stringify(data, null, 4);
    }
    function _clear() {
        _paddocksSource.clear();
        _farmSource.clear();
    }
    function _integrateGMap(gmap) {
        _view.on("change:center", function() {
            var center = ol.proj.transform(_view.getCenter(), googlemapslayer.getProjection(), _projection);
            gmap.setCenter(new google.maps.LatLng(center[1], center[0]));
        });
        _view.on("change:resolution", function() {
            gmap.setZoom(_view.getZoom());
        });
        window.onresize = function() {
            var center = _transform(_view.getCenter(), googlemapslayer.getProjection(), _projection);
            google.maps.event.trigger(gmap, "resize");
            gmap.setCenter(center);
        };
        if (_isNew) {
            gmap.controls[google.maps.ControlPosition.TOP_LEFT].push(_targetEl);
            _targetEl.parentNode.removeChild(_targetEl);
            _view.setCenter(ol.proj.transform([ defaults.centerNew[1], defaults.centerNew[0] ], _projection, googlemapslayer.getProjection()));
            _view.setZoom(defaults.zoomNew);
        } else {
            _view.fitExtent(_farmSource.getExtent(), _size);
        }
    }
    function _getView() {
        return _view;
    }
    function _getProjection() {
        return _projection;
    }
    function _center(coordinates) {
        _view.setCenter(coordinates);
        _view.setZoom(15);
    }
    function _paddocksLayer(paddocksGeometry) {
        var _paddocksSource = new ol.source.Vector({
            features: new ol.format.GeoJSON().readFeatures(paddocksGeometry, {
                dataProjection: "EPSG:4283",
                featureProjection: "EPSG:3857"
            })
        });
        return new ol.layer.Vector({
            source: _paddocksSource,
            style: new ol.style.Style({
                fill: new ol.style.Fill({
                    color: "rgba(255, 255, 255, 0.3)"
                }),
                stroke: new ol.style.Stroke({
                    color: "#319FD3",
                    width: 1
                })
            })
        });
    }
    function _farmLayer(farmGeometry) {
        var paddocksSource = new ol.source.Vector({
            features: new ol.format.GeoJSON().readFeatures(farmGeometry, {
                dataProjection: "EPSG:4283",
                featureProjection: "EPSG:3857"
            })
        });
        return new ol.layer.Vector({
            source: paddocksSource,
            style: new ol.style.Style({
                fill: new ol.style.Fill({
                    color: "rgba(255, 255, 255, 0.3)"
                }),
                stroke: new ol.style.Stroke({
                    color: "#319FD3",
                    width: 1
                })
            })
        });
    }
    return {
        init: _init,
        load: _load,
        exportGeometry: _exportGeometry,
        clear: _clear,
        center: _center,
        integrateGMap: _integrateGMap,
        getProjection: _getProjection,
        paddocksLayer: _paddocksLayer,
        farmLayer: _farmLayer
    };
});

"use strict";

angular.module("farmbuild.webmapping").factory("webMappingSession", function($log, farmdata, validations) {
    var webMappingSession = {}, _isDefined = validations.isDefined;
    function load() {
        var root = farmdata.session.find();
        if (!_isDefined(root)) {
            return undefined;
        }
        return root.webMapping;
    }
    webMappingSession.saveSection = function(section, value) {
        var loaded = load();
        if (!_isDefined(loaded)) {
            $log.error("Unable to find an existing farmData! please create then save.");
            return webMappingSession;
        }
        loaded[section] = value;
        return save(loaded);
    };
    function save(toSave) {
        var farmData = farmdata.session.find();
        if (!_isDefined(farmData)) {
            $log.error("Unable to find the farmData in the session!");
            return undefined;
        }
        farmData.dateLastUpdated = new Date();
        farmData.webMapping = toSave;
        farmdata.session.save(farmData);
        return toSave;
    }
    webMappingSession.save = save;
    webMappingSession.loadSection = function(section) {
        var loaded = load();
        return loaded ? loaded[section] : null;
    };
    webMappingSession.isLoadFlagSet = function(location) {
        var load = false;
        if (location.href.split("?").length > 1 && location.href.split("?")[1].indexOf("load") === 0) {
            load = location.href.split("?")[1].split("=")[1] === "true";
        }
        return load;
    };
    webMappingSession.find = function() {
        return farmdata.session.find();
    };
    return webMappingSession;
});

"use strict";

angular.module("farmbuild.webmapping").factory("googleaddresssearch", function(validations, $log, openLayers, googlemapslayer) {
    var countryRestrict = {
        country: "au"
    };
    function _init(targetElementId) {
        var autocomplete = new google.maps.places.Autocomplete(document.getElementById(targetElementId), {
            componentRestrictions: countryRestrict
        });
        google.maps.event.addListener(autocomplete, "place_changed", function() {
            _onPlaceChanged(autocomplete);
        });
    }
    function _onPlaceChanged(autocomplete) {
        var place = autocomplete.getPlace(), latLng;
        if (!place.geometry) {
            return;
        }
        latLng = place.geometry.location;
        _center(latLng);
    }
    function _transform(latLng, sourceProjection, destinationProjection) {
        return ol.proj.transform([ latLng.lng(), latLng.lat() ], sourceProjection, destinationProjection);
    }
    function _center(latLng) {
        var googleMapProjection = googlemapslayer.getProjection(), openLayerProjection = openLayers.getProjection(), centerPoint = _transform(latLng, openLayerProjection, googleMapProjection);
        openLayers.center(centerPoint);
    }
    return {
        init: _init
    };
});

"use strict";

angular.module("farmbuild.webmapping").factory("googlemapslayer", function(validations, $log) {
    var _projection = "EPSG:3857";
    function _init(targetElementId) {
        return new google.maps.Map(document.getElementById(targetElementId), {
            disableDefaultUI: true,
            keyboardShortcuts: false,
            draggable: false,
            disableDoubleClickZoom: true,
            scrollwheel: false,
            streetViewControl: false,
            mapTypeId: google.maps.MapTypeId.SATELLITE
        });
    }
    function _getProjection() {
        return _projection;
    }
    return {
        init: _init,
        getProjection: _getProjection
    };
});

var MERGE, REMOVE, CLIP, AREA;

angular.module("farmbuild.webmapping").factory("openlayersDraw", function(validations, $log) {
    var _isDefined = validations.isDefined, _draw, _modify, _select, _snap, _layer, _source, _init = function(layer, map) {
        var selectedLayer = document.getElementById("layers");
        if (!_isDefined(layer)) {
            return;
        }
        _layer = layer;
        _source = layer.getSource();
        map.on("click", function(evt) {
            var activeLayer = selectedLayer.value;
            if (!(activeLayer === "farm" || activeLayer === "paddocks")) {
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
        function _removeInteractions() {
            map.getInteractions().clear();
            map.addInteraction(new ol.interaction.DragPan({
                kinetic: null
            }));
        }
        _removeInteractions(map);
        if (!_isDefined(_source)) {
            _source = new ol.source.Vector({
                features: []
            });
        }
        var modify = function() {
            _select = new ol.interaction.Select({
                addCondition: ol.events.condition.shiftKeyOnly,
                layers: [ layer ]
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
                _select.on("change:active", function() {
                    selectedFeatures.forEach(selectedFeatures.remove, selectedFeatures);
                });
            }
            return {
                init: _init,
                enable: _enable,
                disable: _disable
            };
        }();
        var draw = function() {
            _draw = new ol.interaction.Draw({
                source: _source,
                type: "Polygon"
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
            };
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
    function _merge() {
        var format = new ol.format["GeoJSON"](), data, featuresToMerge = _select.getFeatures().getArray(), merged;
        _removeFeatures(featuresToMerge, _layer);
        data = angular.fromJson(format.writeFeatures(featuresToMerge));
        merged = turf.merge(data);
        _source.addFeature(new ol.Feature({
            geometry: new ol.geom.Polygon(merged.geometry.coordinates)
        }));
        _select.getFeatures().clear();
    }
    function _clip(clippee, clipper) {
        return turf.erase(clippee, clipper);
    }
    function _clipAdd() {
        _source.removeFeature(_select.getFeatures().item(0));
        var format = new ol.format["GeoJSON"](), featureToClip = angular.fromJson(format.writeFeatures(_select.getFeatures().getArray())).features[0], layerFeatures = _source.getFeatures(), clipped = featureToClip;
        angular.forEach(layerFeatures, function(layerFeature) {
            var clipper = angular.fromJson(format.writeFeature(layerFeature));
            clipped = _clip(clipped, clipper);
        });
        _source.addFeature(new ol.Feature({
            geometry: new ol.geom[clipped.geometry.type](clipped.geometry.coordinates)
        }));
        _select.getFeatures().clear();
    }
    function _area() {
        var format = new ol.format["GeoJSON"](), features, olFeatures = _select.getFeatures().getArray();
        features = angular.fromJson(format.writeFeatures(olFeatures));
        return turf.area(features) * 1e-4;
    }
    function _removeFeatures(features, layer) {
        if (_isDefined(features)) {
            angular.forEach(features, function(feature) {
                layer.getSource().removeFeature(feature);
            });
        }
    }
    function _remove() {
        var featuresToRemove = _select.getFeatures().getArray();
        _removeFeatures(featuresToRemove, _layer);
        _select.getFeatures().clear();
    }
    MERGE = _merge;
    REMOVE = _remove;
    CLIP = _clipAdd;
    AREA = _area;
    return {
        init: _init,
        merge: _merge,
        remove: _remove,
        clip: _clipAdd,
        area: _area
    };
});

"use strict";

angular.module("farmbuild.webmapping").run(function(webmapping) {});

angular.injector([ "ng", "farmbuild.webmapping" ]);
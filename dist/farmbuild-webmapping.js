"use strict";

angular.module("farmbuild.webmapping", [ "farmbuild.core", "farmbuild.farmdata" ]).factory("webmapping", function(farmdata, validations, $log, geoJsonValidator, farmdataConverter, webMappingSession, webMappingProjections, webMappingInteractions, webMappingPaddocks, webMappingOpenLayersHelper, webMappingGoogleAddressSearch, webMappingGoogleAnalytics, webMappingParcels) {
    $log.info("Welcome to Web Mapping...");
    var _isDefined = validations.isDefined, session = webMappingSession, webMapping = {
        session: session,
        farmdata: farmdata,
        validator: geoJsonValidator,
        toGeoJsons: farmdataConverter.toGeoJsons,
        actions: webMappingInteractions,
        paddocks: webMappingPaddocks,
        olHelper: webMappingOpenLayersHelper,
        googleAddressSearch: webMappingGoogleAddressSearch,
        ga: webMappingGoogleAnalytics,
        parcels: webMappingParcels,
        load: session.load,
        find: session.find,
        save: function(geoJsons) {
            var farmData = session.find();
            return session.save(farmdataConverter.toFarmData(farmData, geoJsons), geoJsons);
        },
        "export": session.export,
        create: farmdata.create
    };
    webMapping.version = "0.1.0";
    if (typeof window.farmbuild === "undefined") {
        window.farmbuild = {
            webmapping: webMapping
        };
    } else {
        window.farmbuild.webmapping = webMapping;
    }
    return webMapping;
});

"use strict";

angular.module("farmbuild.webmapping").factory("webMappingGoogleAnalytics", function($log, validations, googleAnalytics) {
    var webMappingGoogleAnalytics = {}, api = "farmbuild-webmapping", _isDefined = validations.isDefined;
    webMappingGoogleAnalytics.trackWebMapping = function(clientName) {
        $log.info("googleAnalyticsWebMapping.trackWebMapping clientName: %s", clientName);
        googleAnalytics.track(api, clientName);
    };
    return webMappingGoogleAnalytics;
});

"use strict";

angular.module("farmbuild.webmapping").factory("webMappingDrawInteraction", function(validations, $log) {
    var _isDefined = validations.isDefined;
    function _create(map, farmSource, paddocksSource) {
        var drawInteraction = new ol.interaction.Draw({
            source: paddocksSource,
            type: "Polygon"
        }), drawingStatus = false;
        function _init(clipFn, selectInteraction) {
            $log.info("draw interaction init ...");
            map.addInteraction(drawInteraction);
            drawInteraction.setActive(false);
            drawInteraction.on("drawend", function(e) {
                $log.info("draw end ...");
                var feature = e.feature;
                clipFn(feature, paddocksSource, farmSource);
                setTimeout(function() {
                    paddocksSource.removeFeature(feature);
                }, 100);
                drawingStatus = false;
            });
            drawInteraction.on("drawstart", function(event) {
                $log.info("draw start ...");
                selectInteraction.interaction.getFeatures().clear();
                drawingStatus = true;
            });
        }
        function _enable() {
            drawInteraction.setActive(true);
        }
        function _disable() {
            drawInteraction.setActive(false);
        }
        function _finish() {
            drawInteraction.finishDrawing();
        }
        function _isDrawing() {
            return drawingStatus;
        }
        function _discard() {
            drawingStatus = false;
            _disable();
            _enable();
        }
        return {
            init: _init,
            enable: _enable,
            disable: _disable,
            interaction: drawInteraction,
            isDrawing: _isDrawing,
            finish: _finish,
            discard: _discard
        };
    }
    return {
        create: _create
    };
});

"use strict";

angular.module("farmbuild.webmapping").factory("webMappingInteractions", function(validations, $log, webMappingSelectInteraction, webMappingModifyInteraction, webMappingDrawInteraction, webMappingSnapInteraction, webMappingTransformation) {
    var _isDefined = validations.isDefined, _select, _modify, _draw, _snap, _activeLayer, _activeLayerName, _mode, transform = webMappingTransformation;
    function _destroy(map) {
        $log.info("destroying all interactions ...");
        if (!_isDefined(_select) || !_isDefined(_modify) || !_isDefined(_snap) || !_isDefined(_draw)) {
            return;
        }
        map.removeInteraction(_select.interaction);
        map.removeInteraction(_modify.interaction);
        map.removeInteraction(_draw.interaction);
        map.removeInteraction(_snap.interaction);
        _select = undefined;
        _modify = undefined;
        _draw = undefined;
        _snap = undefined;
        _activeLayer = undefined;
        _activeLayerName = undefined;
        _mode = undefined;
    }
    function _init(map, farmLayer, paddocksLayer, activeLayerName, multi) {
        $log.info("interactions init ...");
        if (!_isDefined(activeLayerName) || !_isDefined(map) || !_isDefined(paddocksLayer) || !_isDefined(farmLayer)) {
            return;
        }
        if (activeLayerName === "paddocks") {
            _activeLayer = paddocksLayer;
        } else if (activeLayerName === "farm") {
            _activeLayer = farmLayer;
        } else {
            return;
        }
        _select = webMappingSelectInteraction.create(map, _activeLayer, multi);
        _modify = webMappingModifyInteraction.create(map, _select);
        _draw = webMappingDrawInteraction.create(map, farmLayer.getSource(), paddocksLayer.getSource());
        _snap = webMappingSnapInteraction.create(map, farmLayer.getSource(), paddocksLayer.getSource());
        _mode = "";
        _activeLayerName = activeLayerName;
        _select.init();
        _modify.init();
        _draw.init(_clip, _select);
        _snap.init();
    }
    function _addFeature(layer, feature, name) {
        if (!_isDefined(feature) || !_isDefined(name)) {
            return;
        }
        $log.info("adding feature ...", feature);
        feature.setProperties({
            name: name
        });
        layer.getSource().addFeature(feature);
        _clearSelections();
    }
    function _removeFeatures(features, deselect) {
        if (!_isDefined(deselect)) {
            deselect = true;
        }
        $log.info("removing features ...", features);
        if (_isDefined(features)) {
            features.forEach(function(feature) {
                _activeLayer.getSource().removeFeature(feature);
            });
        }
        if (deselect) {
            _clearSelections();
        }
    }
    function _clip(featureToClip, paddockSource, farmSource) {
        $log.info("clipping feature ...", featureToClip);
        if (_activeLayerName === "paddocks" && (_mode === "draw" || _mode === "edit")) {
            _clipPaddocks(featureToClip, paddockSource, farmSource);
        }
        if (_activeLayerName === "paddocks" && _mode === "donut-draw") {
            _clipDonut(featureToClip);
        }
        if (_activeLayerName === "farm") {
            _clipFarm(featureToClip, farmSource);
        }
    }
    function _clipPaddocks(featureToClip, paddockSource, farmSource) {
        if (farmSource.getFeatures()[0].getGeometry().getExtent()[0] === Infinity) {
            return;
        }
        var clipped, paddocksFeatures = paddockSource.getFeatures(), farmFeatures = farmSource.getFeatures(), name = featureToClip.getProperties().name || "Paddock " + new Date().getTime();
        clipped = transform.erase(featureToClip, paddocksFeatures);
        clipped = transform.intersect(clipped, farmFeatures);
        _addFeature(_activeLayer, clipped, name);
    }
    function _clipDonut(donutFeature) {
        var clipped, paddockFeature = _activeLayer.getSource().getFeaturesInExtent(donutFeature.getGeometry().getExtent())[0], name = donutFeature.getProperties().name || "Paddock " + new Date().getTime();
        clipped = transform.erase(paddockFeature, donutFeature);
        _addFeature(_activeLayer, clipped, name);
        _activeLayer.getSource().removeFeature(paddockFeature);
    }
    function _clipFarm(featureToClip, farmSource) {
        var clipped = featureToClip, name;
        if (farmSource.getFeatures()[0]) {
            name = farmSource.getFeatures()[0].getProperties().name;
        }
        if (farmSource.getFeatures()[0].getGeometry().getExtent()[0] !== Infinity) {
            clipped = transform.erase(featureToClip, farmSource.getFeatures());
            _addFeature(_activeLayer, clipped, name);
            clipped = transform.merge(farmSource.getFeatures());
        }
        _removeFeatures(farmSource.getFeatures(), false);
        _addFeature(_activeLayer, clipped, name);
        _clearSelections();
    }
    function _merge(features) {
        $log.info("merging features ...", features);
        _removeFeatures(features, false);
        _addFeature(_activeLayer, transform.merge(features));
        _clearSelections();
    }
    function _selectedFeatures() {
        if (!_isDefined(_select) || !_isDefined(_select.interaction)) {
            return;
        }
        $log.info("Selected features ...", _select.interaction.getFeatures());
        return _select.interaction.getFeatures();
    }
    function _enableEditing() {
        if (!-_isDefined(_mode) || _mode === "edit") {
            return;
        }
        $log.info("editing enabled");
        _select.enable();
        _modify.enable();
        _snap.enable();
        _draw.disable();
        _mode = "edit";
    }
    function _enableDrawing() {
        if (!-_isDefined(_mode) || _mode === "draw") {
            return;
        }
        $log.info("drawing enabled");
        _select.disable();
        _modify.disable();
        _draw.enable();
        _snap.enable();
        _mode = "draw";
    }
    function _enableDonutDrawing() {
        if (!-_isDefined(_mode) || _mode === "donut-draw") {
            return;
        }
        $log.info("donut drawing enabled");
        _select.disable();
        _modify.disable();
        _draw.enable();
        _snap.enable();
        _mode = "donut-draw";
    }
    function _clearSelections() {
        _select.interaction.getFeatures().clear();
    }
    function _isDrawing() {
        if (!-_isDefined(_mode)) {
            return;
        }
        return _draw.isDrawing();
    }
    function _finishDrawing() {
        if (!-_isDefined(_mode)) {
            return;
        }
        _draw.finish();
    }
    function _discardDrawing() {
        if (!-_isDefined(_mode)) {
            return;
        }
        _draw.discard();
    }
    function _isEditing() {
        if (!-_isDefined(_mode)) {
            return;
        }
        return _select.interaction.getFeatures().getLength() > 0;
    }
    return {
        init: _init,
        destroy: _destroy,
        enableDrawing: _enableDrawing,
        enableEditing: _enableEditing,
        enableDonutDrawing: _enableDonutDrawing,
        clip: _clip,
        merge: _merge,
        remove: _removeFeatures,
        selectedFeatures: _selectedFeatures,
        isDrawing: _isDrawing,
        isEditing: _isEditing,
        finishDrawing: _finishDrawing,
        discardDrawing: _discardDrawing
    };
});

"use strict";

angular.module("farmbuild.webmapping").factory("webMappingModifyInteraction", function(validations, $log) {
    var _isDefined = validations.isDefined;
    function _create(map, select) {
        var modifyInteraction = new ol.interaction.Modify({
            features: select.interaction.getFeatures()
        });
        function _init() {
            $log.info("modify interaction init ...");
            map.addInteraction(modifyInteraction);
            modifyInteraction.setActive(false);
        }
        function _enable() {
            modifyInteraction.setActive(true);
        }
        function _disable() {
            modifyInteraction.setActive(false);
        }
        return {
            init: _init,
            enable: _enable,
            disable: _disable,
            interaction: modifyInteraction
        };
    }
    return {
        create: _create
    };
});

"use strict";

angular.module("farmbuild.webmapping").factory("webMappingSelectInteraction", function(validations, $log) {
    var _isDefined = validations.isDefined;
    function _create(map, layer, multi) {
        if (!_isDefined(multi)) {
            multi = false;
        }
        var selectConfig = {
            multi: multi,
            layers: [ layer ]
        };
        if (multi) {
            selectConfig.addCondition = ol.events.condition.shiftKeyOnly;
        } else {
            selectConfig.addCondition = ol.events.condition.never;
            selectConfig.toggleCondition = ol.events.condition.never;
        }
        var selectInteraction = new ol.interaction.Select(selectConfig);
        function _init() {
            $log.info("select interaction init ...");
            map.addInteraction(selectInteraction);
            selectInteraction.setActive(false);
        }
        function _enable() {
            selectInteraction.setActive(true);
        }
        function _disable() {
            selectInteraction.setActive(false);
        }
        return {
            init: _init,
            enable: _enable,
            disable: _disable,
            interaction: selectInteraction
        };
    }
    return {
        create: _create
    };
});

"use strict";

angular.module("farmbuild.webmapping").factory("webMappingSnapInteraction", function(validations, $log) {
    var _isDefined = validations.isDefined;
    function _create(map, farmSource, paddocksSource) {
        var snapInteraction = new ol.interaction.Snap({
            source: paddocksSource
        });
        snapInteraction.addFeature(farmSource.getFeatures()[0]);
        function _enable() {
            snapInteraction.setActive(true);
        }
        function _disable() {
            snapInteraction.setActive(false);
        }
        function _init() {
            $log.info("snap interaction init ...");
            map.addInteraction(snapInteraction);
            snapInteraction.setActive(false);
        }
        return {
            init: _init,
            enable: _enable,
            disable: _disable,
            interaction: snapInteraction
        };
    }
    return {
        create: _create
    };
});

"use strict";

angular.module("farmbuild.webmapping").factory("webMappingMeasurement", function(validations, $log) {
    var _isDefined = validations.isDefined, _geoJSONFormat = new ol.format["GeoJSON"]();
    function _featuresToGeoJson(olFeatures, dataProjection, featureProjection) {
        if (olFeatures.getArray) {
            return _geoJSONFormat.writeFeaturesObject(olFeatures.getArray(), {
                dataProjection: dataProjection,
                featureProjection: featureProjection
            });
        }
        return _geoJSONFormat.writeFeatureObject(olFeatures, {
            dataProjection: dataProjection,
            featureProjection: featureProjection
        });
    }
    function _olArea(olFeatures, dataProjection, featureProjection) {
        $log.info("calculating area of features ...", olFeatures);
        var geoJsonFeatures = _featuresToGeoJson(olFeatures, dataProjection, featureProjection);
        return turf.area(geoJsonFeatures) * 1e-4;
    }
    function _area(features) {
        $log.info("calculating area of features ...", features);
        return turf.area(features) * 1e-4;
    }
    function _measure(map, type) {
        var sketch;
        var helpTooltipElement;
        var helpTooltip;
        var measureTooltipElement;
        var measureTooltip;
        var continuePolygonMsg = "Click to continue drawing the polygon";
        var continueLineMsg = "Click to continue drawing the line";
        var pointerMoveHandler = function(evt) {
            if (evt.dragging) {
                return;
            }
            var helpMsg = "Click to start drawing";
            var tooltipCoord = evt.coordinate;
            var formatLength = function(line) {
                var length;
                length = Math.round(line.getLength() * 100) / 100;
                var output;
                if (length > 100) {
                    output = Math.round(length / 1e3 * 100) / 100 + " " + "km";
                } else {
                    output = Math.round(length * 100) / 100 + " " + "m";
                }
                console.log(output);
            };
            var formatArea = function(polygon) {
                var area;
                area = polygon.getArea();
                var output;
                if (area > 1e4) {
                    output = Math.round(area / 1e6 * 100) / 100 + " " + "km<sup>2</sup>";
                } else {
                    output = Math.round(area * 100) / 100 + " " + "m<sup>2</sup>";
                }
                console.log(output);
            };
            if (sketch) {
                var output;
                var geom = sketch.getGeometry();
                if (geom instanceof ol.geom.Polygon) {
                    output = formatArea(geom);
                    helpMsg = continuePolygonMsg;
                    tooltipCoord = geom.getInteriorPoint().getCoordinates();
                } else if (geom instanceof ol.geom.LineString) {
                    output = formatLength(geom);
                    helpMsg = continueLineMsg;
                    tooltipCoord = geom.getLastCoordinate();
                }
                measureTooltipElement.innerHTML = output;
                measureTooltip.setPosition(tooltipCoord);
            }
            helpTooltipElement.innerHTML = helpMsg;
            helpTooltip.setPosition(evt.coordinate);
        };
        var source = new ol.source.Vector();
        var vector = new ol.layer.Vector({
            source: source,
            style: new ol.style.Style({
                fill: new ol.style.Fill({
                    color: "rgba(255, 255, 255, 0.2)"
                }),
                stroke: new ol.style.Stroke({
                    color: "#ffcc33",
                    width: 2
                }),
                image: new ol.style.Circle({
                    radius: 7,
                    fill: new ol.style.Fill({
                        color: "#ffcc33"
                    })
                })
            })
        });
        var draw;
        var type = type == "area" ? "Polygon" : "LineString";
        draw = new ol.interaction.Draw({
            source: source,
            type: type,
            style: new ol.style.Style({
                fill: new ol.style.Fill({
                    color: "rgba(255, 255, 255, 0.2)"
                }),
                stroke: new ol.style.Stroke({
                    color: "rgba(0, 0, 0, 0.5)",
                    lineDash: [ 10, 10 ],
                    width: 2
                }),
                image: new ol.style.Circle({
                    radius: 5,
                    stroke: new ol.style.Stroke({
                        color: "rgba(0, 0, 0, 0.7)"
                    }),
                    fill: new ol.style.Fill({
                        color: "rgba(255, 255, 255, 0.2)"
                    })
                })
            })
        });
        map.addInteraction(draw);
        draw.on("drawstart", function(evt) {
            sketch = evt.feature;
        }, this);
        draw.on("drawend", function(evt) {
            measureTooltipElement.className = "tooltip tooltip-static";
            measureTooltip.setOffset([ 0, -7 ]);
            sketch = null;
            measureTooltipElement = null;
            createMeasureTooltip();
        }, this);
        map.on("pointermove", pointerMoveHandler);
        function createHelpTooltip() {
            if (helpTooltipElement) {
                helpTooltipElement.parentNode.removeChild(helpTooltipElement);
            }
            helpTooltipElement = document.createElement("div");
            helpTooltipElement.className = "tooltip";
            helpTooltip = new ol.Overlay({
                element: helpTooltipElement,
                offset: [ 15, 0 ],
                positioning: "center-left"
            });
            map.addOverlay(helpTooltip);
        }
        function createMeasureTooltip() {
            if (measureTooltipElement) {
                measureTooltipElement.parentNode.removeChild(measureTooltipElement);
            }
            measureTooltipElement = document.createElement("div");
            measureTooltipElement.className = "tooltip tooltip-measure";
            measureTooltip = new ol.Overlay({
                element: measureTooltipElement,
                offset: [ 0, -15 ],
                positioning: "bottom-center"
            });
            map.addOverlay(measureTooltip);
        }
        createMeasureTooltip();
        createHelpTooltip();
    }
    return {
        area: _area,
        measure: _measure
    };
});

"use strict";

angular.module("farmbuild.webmapping").factory("webMappingOpenLayersHelper", function(validations, $log) {
    var _isDefined = validations.isDefined;
    function _transform(latLng, sourceProjection, destinationProjection) {
        if (!_isDefined(latLng) || !_isDefined(sourceProjection) || !_isDefined(destinationProjection)) {
            return;
        }
        var transformed = ol.proj.transform(latLng, sourceProjection, destinationProjection);
        return new google.maps.LatLng(transformed[1], transformed[0]);
    }
    function _exportGeometry(source, dataProjection, featureProjection) {
        if (!_isDefined(source)) {
            return;
        }
        var format = new ol.format["GeoJSON"]();
        try {
            var result = format.writeFeaturesObject(source.getFeatures(), {
                dataProjection: dataProjection,
                featureProjection: featureProjection
            });
            angular.forEach(result.features, function(feature) {
                feature.geometry.crs = {
                    properties: {
                        name: "EPSG:4283"
                    }
                };
            });
            return result;
        } catch (e) {
            $log.error(e);
        }
    }
    function _clear(farmSource, paddocksSource) {
        if (!_isDefined(farmSource) || !_isDefined(paddocksSource)) {
            return;
        }
        $log.info("clearing source ...");
        paddocksSource.clear();
        farmSource.clear();
    }
    function _integrateGMap(gmap, map, dataProjection) {
        if (!_isDefined(gmap) || !_isDefined(map) || !_isDefined(dataProjection)) {
            return;
        }
        $log.info("integrating google map ...");
        var view = map.getView(), targetElement = map.getTargetElement(), googleProjection = "EPSG:3857";
        view.on("change:center", function() {
            var center = ol.proj.transform(view.getCenter(), googleProjection, dataProjection);
            gmap.setCenter(new google.maps.LatLng(center[1], center[0]));
        });
        view.on("change:resolution", function() {
            gmap.setZoom(view.getZoom());
        });
        window.onresize = function() {
            var center = _transform(view.getCenter(), googleProjection, dataProjection);
            google.maps.event.trigger(gmap, "resize");
            gmap.setCenter(center);
        };
        var defaults = {
            centerNew: [ -36.22488327137526, 145.5826132801325 ],
            zoomNew: 6
        };
        var extent = map.getLayers().item(1).getSource().getExtent();
        $log.info("farm extent: %j", extent);
        if (extent[0] === Infinity) {
            gmap.controls[google.maps.ControlPosition.TOP_LEFT].push(targetElement);
            targetElement.parentNode.removeChild(targetElement);
            view.setCenter(ol.proj.transform([ defaults.centerNew[1], defaults.centerNew[0] ], dataProjection, googleProjection));
            view.setZoom(defaults.zoomNew);
            return;
        }
        gmap.controls[google.maps.ControlPosition.TOP_LEFT].push(targetElement);
        targetElement.parentNode.removeChild(targetElement);
        view.fitExtent(extent, map.getSize());
    }
    function _center(coordinates, map) {
        if (!_isDefined(coordinates) || !_isDefined(map)) {
            return;
        }
        $log.info("centring view ...");
        map.getView().setCenter(coordinates);
        map.getView().setZoom(15);
    }
    function _paddocksLayer(paddocksGeometry, dataProjection, featureProjection) {
        if (!_isDefined(paddocksGeometry) || !_isDefined(dataProjection) || !_isDefined(featureProjection)) {
            return;
        }
        $log.info("creating paddocks vector layer ...", dataProjection, featureProjection);
        var paddocksSource = new ol.source.Vector({
            features: new ol.format.GeoJSON().readFeatures(paddocksGeometry, {
                dataProjection: dataProjection,
                featureProjection: featureProjection
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
    function _farmLayer(farmGeometry, dataProjection, featureProjection) {
        if (!_isDefined(farmGeometry) || !_isDefined(dataProjection) || !_isDefined(featureProjection)) {
            return;
        }
        $log.info("creating farm vector layer ...", dataProjection, featureProjection);
        var farmSource = new ol.source.Vector({
            features: new ol.format.GeoJSON().readFeatures(farmGeometry, {
                dataProjection: dataProjection,
                featureProjection: featureProjection
            })
        });
        return new ol.layer.Vector({
            source: farmSource,
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
    }
    function _reload(map, geoJson, dataProjectionCode, featureProjectionCode) {
        var layers = map.getLayers();
        layers.clear();
        map.addLayer(_paddocksLayer(geoJson.paddocks, dataProjectionCode, featureProjectionCode));
        map.addLayer(_farmLayer(geoJson.farm, dataProjectionCode, featureProjectionCode));
    }
    return {
        exportGeometry: _exportGeometry,
        clear: _clear,
        center: _center,
        integrateGMap: _integrateGMap,
        paddocksLayer: _paddocksLayer,
        farmLayer: _farmLayer,
        reload: _reload
    };
});

"use strict";

angular.module("farmbuild.webmapping").factory("webMappingPaddocks", function($log, validations) {
    var _isDefined = validations.isDefined;
    function _findByCoordinate(coordinate, vectorLayer) {
        var found;
        if (!_isDefined(coordinate) || !_isDefined(vectorLayer)) {
            return;
        }
        var paddocks = vectorLayer.getSource().getFeaturesAtCoordinate(coordinate);
        if (paddocks && paddocks.length > 0) {
            found = vectorLayer.getSource().getFeaturesAtCoordinate(coordinate)[0];
        }
        $log.info("looking up for a paddock at ", coordinate, found);
        return found;
    }
    return {
        findByCoordinate: _findByCoordinate
    };
});

var loadFeatures = function(data) {
    console.log(data);
};

angular.module("farmbuild.webmapping").factory("webMappingParcels", function($log, $http, validations) {
    var _isDefined = validations.isDefined;
    function _load(serviceUrl, extent, dataProjection, resultProjection) {
        var config = {
            params: {
                service: "WFS",
                version: "1.0.0",
                request: "GetFeature",
                typeName: "farmbuild:parcels",
                maxFeatures: 50,
                outputFormat: "text/javascript",
                format_options: "callback:loadFeatures",
                srsname: resultProjection,
                bbox: extent.join(",") + "," + dataProjection
            }
        };
        if (!_isDefined(serviceUrl) || !_isDefined(extent) || !_isDefined(dataProjection) || !_isDefined(resultProjection)) {
            return;
        }
        $log.info("Loading parcels information for the extent: ", extent);
        return $http({
            method: "JSONP",
            url: serviceUrl,
            params: config.params
        }).success(function(data, status) {
            $log.info("loaded parcels successfully.", status, data);
        }).error(function(data, status) {
            $log.error("loading parcels failed!!", status, data);
        });
    }
    return {
        load: _load
    };
});

"use strict";

angular.module("farmbuild.webmapping").factory("webMappingProjections", function($log, farmdata) {
    var webMappingProjections = {
        supported: farmbuild.farmdata.crsSupported
    };
    farmdata.crsSupported.forEach(function(crs) {
        proj4.defs(crs.name, crs.projection);
    });
    return webMappingProjections;
});

"use strict";

angular.module("farmbuild.webmapping").factory("webMappingSession", function($log, farmdata, validations, webMappingMeasurement) {
    var webMappingSession = {}, _isDefined = validations.isDefined;
    function load(farmData) {
        var loaded = farmdata.load(farmData);
        if (!_isDefined(loaded)) {
            return undefined;
        }
        return farmData;
    }
    webMappingSession.load = load;
    function save(farmData, geoJsons) {
        if (!_isDefined(farmData)) {
            $log.error("Unable to save the undefined farmData!");
            return undefined;
        }
        farmData.area = webMappingMeasurement.area(geoJsons.farm);
        farmData.name = geoJsons.farm.features[0].properties.name;
        return farmdata.update(farmData);
    }
    webMappingSession.save = save;
    webMappingSession.clear = farmdata.session.clear;
    webMappingSession.isLoadFlagSet = farmdata.session.isLoadFlagSet;
    webMappingSession.find = function() {
        return farmdata.session.find();
    };
    webMappingSession.export = function(document, farmData, geoJsons) {
        return farmdata.session.export(document, save(farmData, geoJsons));
    };
    return webMappingSession;
});

"use strict";

angular.module("farmbuild.webmapping").factory("webMappingTransformation", function(validations, $log) {
    var _isDefined = validations.isDefined, _geoJSONFormat = new ol.format["GeoJSON"]();
    function _openLayerFeatureToGeoJson(olFeature) {
        return _geoJSONFormat.writeFeatureObject(olFeature);
    }
    function _openLayerFeaturesToGeoJson(olFeatures) {
        if (olFeatures.getArray) {
            return _geoJSONFormat.writeFeaturesObject(olFeatures.getArray());
        }
        return _geoJSONFormat.writeFeaturesObject(olFeatures);
    }
    function _geoJsonToOpenLayerFeature(feature, properties) {
        if (!_isDefined(feature)) {
            return;
        }
        $log.info("Converting geoJson to openlayer feature ...", feature);
        properties.geometry = new ol.geom[feature.geometry.type](feature.geometry.coordinates);
        properties.geometry.crs = {
            properties: {
                name: "EPSG:4283"
            }
        };
        return new ol.Feature(properties);
    }
    function _erase(olFeature, olFeatures) {
        $log.info("erasing feature", olFeature);
        var feature = _openLayerFeatureToGeoJson(olFeature), properties = olFeature.getProperties();
        try {
            if (olFeatures.forEach) {
                olFeatures.forEach(function(layerFeature) {
                    var clipper = _openLayerFeatureToGeoJson(layerFeature);
                    feature = turf.erase(feature, clipper);
                });
            } else {
                var clipper = _openLayerFeatureToGeoJson(olFeatures);
                feature = turf.erase(feature, clipper);
            }
            return _geoJsonToOpenLayerFeature(feature, properties);
        } catch (e) {
            $log.error(e);
        }
    }
    function _intersect(olFeature, olFeatures) {
        $log.info("intersecting feature", olFeatures);
        var feature = _openLayerFeatureToGeoJson(olFeature), properties = olFeature.getProperties();
        try {
            olFeatures.forEach(function(layerFeature) {
                var clipper = _openLayerFeatureToGeoJson(layerFeature);
                feature = turf.intersect(feature, clipper);
            });
            return _geoJsonToOpenLayerFeature(feature, properties);
        } catch (e) {
            $log.error(e);
        }
    }
    function _merge(olFeatures) {
        $log.info("merging features ...", olFeatures);
        var properties, toMerge;
        toMerge = _openLayerFeaturesToGeoJson(olFeatures);
        properties = {
            name: "merged " + new Date().getTime()
        };
        try {
            return _geoJsonToOpenLayerFeature(turf.merge(toMerge), properties);
        } catch (e) {
            $log.error(e);
        }
    }
    return {
        erase: _erase,
        intersect: _intersect,
        merge: _merge,
        geoJsonToOpenLayerFeature: _geoJsonToOpenLayerFeature
    };
});

"use strict";

angular.module("farmbuild.webmapping").factory("webMappingGoogleAddressSearch", function(validations, $log, webMappingOpenLayersHelper) {
    var countryRestrict = {
        country: "au"
    };
    function _init(targetElementId, openLayersProjection, olmap) {
        var autocomplete = new google.maps.places.Autocomplete(document.getElementById(targetElementId), {
            componentRestrictions: countryRestrict
        });
        google.maps.event.addListener(autocomplete, "place_changed", function() {
            _onPlaceChanged(autocomplete, openLayersProjection, olmap);
        });
    }
    function _onPlaceChanged(autocomplete, openLayersProjection, olmap) {
        var place = autocomplete.getPlace(), latLng;
        if (!place.geometry) {
            return;
        }
        latLng = place.geometry.location;
        _center(latLng, openLayersProjection, olmap);
    }
    function _transform(latLng, sourceProjection, destinationProjection) {
        return ol.proj.transform([ latLng.lng(), latLng.lat() ], sourceProjection, destinationProjection);
    }
    function _center(latLng, openLayersProjection, olmap) {
        var googleMapProjection = "EPSG:3857", centerPoint = _transform(latLng, openLayersProjection, googleMapProjection);
        webMappingOpenLayersHelper.center(centerPoint, olmap);
    }
    return {
        init: _init
    };
});

"use strict";

angular.module("farmbuild.webmapping").run(function(webmapping) {});
"use strict";

angular.module("farmbuild.webmapping", [ "farmbuild.core", "farmbuild.farmdata" ]).factory("webmapping", function(farmdata, validations, $log, geoJsonValidator, farmdataConverter, webMappingSession, webMappingProjections, webMappingInteractions, webMappingMeasurement, webMappingPaddocks, webMappingOpenLayersHelper, webMappingGoogleAddressSearch, webMappingGoogleAnalytics, webMappingParcels) {
    $log.info("Welcome to Web Mapping...");
    var _isDefined = validations.isDefined, session = webMappingSession, webMapping = {
        session: session,
        farmdata: farmdata,
        validator: geoJsonValidator,
        toGeoJsons: farmdataConverter.toGeoJsons,
        toKml: farmdataConverter.toKml,
        toGeoJson: farmdataConverter.toGeoJson,
        exportGeoJson: farmdataConverter.exportGeoJson,
        exportKml: farmdataConverter.exportKml,
        actions: webMappingInteractions,
        paddocks: webMappingPaddocks,
        olHelper: webMappingOpenLayersHelper,
        ga: webMappingGoogleAnalytics,
        parcels: webMappingParcels,
        measurement: webMappingMeasurement,
        load: session.load,
        find: session.find,
        save: function(geoJsons) {
            var farmData = session.find();
            return session.save(farmData, geoJsons);
        },
        "export": session.export,
        create: farmdata.create
    };
    webMapping.version = "1.0.0";
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

angular.module("farmbuild.webmapping").factory("webMappingConverter", function(validations, $log) {
    var _isDefined = validations.isDefined, _geoJSONFormat = new ol.format["GeoJSON"]();
    function _openLayerFeatureToGeoJson(olFeature, dataProjection, featureProjection) {
        if (!_isDefined(olFeature)) {
            return;
        }
        $log.info("Converting openlayer feature to geoJson ...", olFeature);
        return _geoJSONFormat.writeFeatureObject(olFeature, {
            dataProjection: dataProjection,
            featureProjection: featureProjection
        });
    }
    function _openLayerFeaturesToGeoJson(olFeatures, dataProjection, featureProjection) {
        if (!_isDefined(olFeatures)) {
            return;
        }
        $log.info("Converting openlayer feature to geoJson ...", olFeatures);
        return _geoJSONFormat.writeFeaturesObject(olFeatures, {
            dataProjection: dataProjection,
            featureProjection: featureProjection
        });
    }
    function _geoJsonToOpenLayerFeature(feature, dataProjection, featureProjection) {
        if (!_isDefined(feature)) {
            return;
        }
        $log.info("Converting geoJson feature to openlayer feature ...", feature);
        return _geoJSONFormat.readFeature(feature, {
            dataProjection: dataProjection,
            featureProjection: featureProjection
        });
    }
    function _geoJsonToOpenLayerFeatures(features, dataProjection, featureProjection) {
        if (!_isDefined(features)) {
            return;
        }
        $log.info("Converting geoJson feature to openlayer features ...", features);
        return _geoJSONFormat.readFeatures(features, {
            dataProjection: dataProjection,
            featureProjection: featureProjection
        });
    }
    return {
        featureToGeoJson: _openLayerFeatureToGeoJson,
        featuresToGeoJson: _openLayerFeaturesToGeoJson,
        geoJsonToFeature: _geoJsonToOpenLayerFeature,
        geoJsonToFeatures: _geoJsonToOpenLayerFeatures
    };
});

"use strict";

angular.module("farmbuild.webmapping").factory("webMappingGeoProcessing", function(validations, webMappingConverter, $log) {
    var _isDefined = validations.isDefined, converter = webMappingConverter;
    function _eraseAll(clipee, clippers) {
        if (!_isDefined(clipee) || !_isDefined(clippers)) {
            return;
        }
        $log.info("erasing feature", clipee);
        var clipeeGeoJson = converter.featureToGeoJson(clipee);
        clippers.forEach(function(clipper) {
            var clipperGeoJson = converter.featureToGeoJson(clipper);
            try {
                clipeeGeoJson = turf.erase(clipeeGeoJson, clipperGeoJson);
            } catch (e) {
                $log.warn("This operation is not supported,", e);
            }
        });
        return converter.geoJsonToFeature(clipeeGeoJson);
    }
    function _erase(clipee, clipper) {
        if (!_isDefined(clipee) || !_isDefined(clipper)) {
            return;
        }
        $log.info("erasing feature 2 from 1", clipee, clipper);
        var clipeeGeoJson = converter.featureToGeoJson(clipee), cliperGeoJson = converter.featureToGeoJson(clipper), clipped;
        try {
            clipped = turf.erase(clipeeGeoJson, cliperGeoJson);
            return converter.geoJsonToFeature(clipped);
        } catch (e) {
            $log.warn("This operation is not supported,", e);
        }
    }
    function _intersect(olFeature1, olFeature2) {
        $log.info("intersecting feature", olFeature1, olFeature2);
        var feature1 = converter.featureToGeoJson(olFeature1), feature2 = converter.featureToGeoJson(olFeature2), intersection;
        try {
            intersection = turf.intersect(feature1, feature2);
            return converter.geoJsonToFeature(intersection);
        } catch (e) {
            $log.warn("This operation is not supported,", e);
        }
    }
    function _merge(olFeatures) {
        $log.info("merging features ...", olFeatures);
        var properties, toMerge;
        toMerge = converter.featuresToGeoJson(olFeatures);
        properties = {
            name: "merged " + new Date().getTime()
        };
        try {
            return converter.geoJsonToFeature(turf.merge(toMerge), properties);
        } catch (e) {
            $log.warn("This operation is not supported,", e);
        }
    }
    return {
        eraseAll: _eraseAll,
        erase: _erase,
        intersect: _intersect,
        merge: _merge
    };
});

"use strict";

angular.module("farmbuild.webmapping").factory("webMappingDrawInteraction", function(validations, $log, $rootScope) {
    var _isDefined = validations.isDefined, _mode;
    function _create(map) {
        var drawInteraction = new ol.interaction.Draw({
            source: new ol.source.Vector(),
            type: "Polygon"
        }), drawingStatus = false;
        function _init() {
            $log.info("draw interaction init ...");
            map.addInteraction(drawInteraction);
            drawInteraction.setActive(false);
            drawInteraction.on("drawend", function(e) {
                drawingStatus = false;
                if (_mode === "draw") {
                    $rootScope.$broadcast("web-mapping-draw-end", e.feature);
                }
                if (_mode === "donut-draw") {
                    $rootScope.$broadcast("web-mapping-donut-draw-end", e.feature);
                }
            });
            drawInteraction.on("drawstart", function(event) {
                $log.info("draw start ...");
                drawingStatus = true;
            });
        }
        function _enable(mode) {
            _mode = mode;
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
            _enable(_mode);
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

angular.module("farmbuild.webmapping").factory("webMappingInteractions", function(validations, $log, webMappingSelectInteraction, webMappingModifyInteraction, webMappingDrawInteraction, webMappingSnapInteraction, webMappingGeoProcessing, $rootScope) {
    var _isDefined = validations.isDefined, _select, _modify, _draw, _snap, _activeLayer, _activeLayerName, _mode, _farmLayerGroup, _farmLayer, _paddocksLayer, _map, _transform = webMappingGeoProcessing, _farmName, _donutContainer;
    function _destroy(map) {
        $log.info("destroying all interactions ...");
        if (!_isDefined(_select) || !_isDefined(_modify) || !_isDefined(_snap) || !_isDefined(_draw)) {
            return;
        }
        map.removeInteraction(_select.interaction);
        map.removeInteraction(_modify.interaction);
        map.removeInteraction(_draw.interaction);
        _snap.destroy(map);
        _select = undefined;
        _modify = undefined;
        _draw = undefined;
        _snap = undefined;
        _activeLayer = undefined;
        _activeLayerName = undefined;
        _mode = undefined;
    }
    function _init(map, farmLayerGroup, activeLayerName, snappingDefaultStatus, initKeyboardInteraction) {
        $log.info("interactions init ...");
        if (!_isDefined(activeLayerName) || !_isDefined(map) || !_isDefined(farmLayerGroup)) {
            return;
        }
        _farmLayerGroup = farmLayerGroup;
        _farmLayer = farmLayerGroup.getLayers().item(1);
        _paddocksLayer = farmLayerGroup.getLayers().item(0);
        _map = map;
        if (activeLayerName === "paddocks") {
            _activeLayer = _paddocksLayer;
        } else if (activeLayerName === "farm") {
            _activeLayer = _farmLayer;
            _farmName = _activeLayer.getSource().getFeatures()[0].getProperties().name;
        } else {
            return;
        }
        _select = webMappingSelectInteraction.create(map, _activeLayer);
        _modify = webMappingModifyInteraction.create(map, _select);
        _draw = webMappingDrawInteraction.create(map, farmLayerGroup);
        _snap = webMappingSnapInteraction.create(map, _farmLayer.getSource(), _paddocksLayer.getSource());
        _mode = "";
        _activeLayerName = activeLayerName;
        _select.init();
        _modify.init();
        _draw.init();
        _snap.init(snappingDefaultStatus);
        if (initKeyboardInteraction) {
            _enableKeyboardShortcuts();
        }
    }
    function _addFeature(layer, feature, newProperties) {
        var properties = newProperties || {};
        if (!_isDefined(feature)) {
            return;
        }
        if (!_isDefined(properties.name)) {
            if (_activeLayerName === "farm") {
                properties.name = _farmName;
            } else {
                properties.name = "Paddock " + new Date().getTime();
            }
        }
        properties.geometry = feature.getProperties().geometry;
        feature.setProperties(properties);
        $log.info("adding feature ...", feature);
        layer.getSource().addFeature(feature);
        _clearSelections();
        return feature;
    }
    function _remove(features, deselect) {
        if (!_isDefined(features) || !_isDefined(_activeLayer)) {
            return;
        }
        if (!_isDefined(deselect)) {
            deselect = true;
        }
        $log.info("removing features ...", features);
        features.forEach(function(feature) {
            try {
                _activeLayer.getSource().removeFeature(feature);
            } catch (e) {
                $log.error(e);
            }
        });
        if (deselect) {
            _clearSelections();
        }
    }
    function _clip(featureToClip, farmLayers) {
        if (!_isDefined(farmLayers) || !_isDefined(farmLayers.getLayers()) || !_isDefined(featureToClip) || !_isDefined(farmLayers.getLayers().item(0)) || !_isDefined(farmLayers.getLayers().item(1))) {
            return;
        }
        $log.info("clipping feature ...", featureToClip);
        var paddockSource = farmLayers.getLayers().item(0).getSource(), farmSource = farmLayers.getLayers().item(1).getSource();
        if (_activeLayerName === "paddocks" && (_mode === "draw" || _mode === "edit")) {
            return _clipPaddocks(featureToClip, paddockSource, farmSource);
        }
        if (_activeLayerName === "paddocks" && _mode === "donut-draw") {
            return _clipDonut(featureToClip);
        }
        if (_activeLayerName === "farm") {
            return _clipFarm(featureToClip, farmSource);
        }
    }
    function _clipPaddocks(featureToClip, paddockSource, farmSource) {
        var properties = featureToClip.getProperties(), paddocksFeatures, farmFeatures, clipped;
        if (farmSource.getFeatures()[0].getGeometry().getExtent()[0] === Infinity) {
            $log.error("please draw farm boundaries before adding paddock");
            return;
        }
        if (_isDefined(properties.name)) {
            paddockSource.removeFeature(featureToClip);
        }
        paddocksFeatures = paddockSource.getFeatures();
        farmFeatures = farmSource.getFeatures();
        properties = featureToClip.getProperties();
        clipped = _transform.eraseAll(featureToClip, paddocksFeatures);
        clipped = _transform.intersect(clipped, farmFeatures[0]);
        return _addFeature(_activeLayer, clipped, properties);
    }
    function _clipDonut(donutFeature) {
        var properties, paddockFeature = _donutContainer, clipped = _transform.erase(paddockFeature, donutFeature);
        if (!_isDefined(paddockFeature)) {
            $log.error("donut must be inside a paddock");
            return;
        }
        properties = paddockFeature.getProperties();
        if (_isDefined(clipped)) {
            _activeLayer.getSource().removeFeature(paddockFeature);
            return _addFeature(_activeLayer, clipped, properties);
        }
    }
    function _clipFarm(featureToClip, farmSource) {
        var clipped = featureToClip, properties, result;
        if (farmSource.getFeatures()[0]) {
            properties = farmSource.getFeatures()[0].getProperties();
        }
        if (farmSource.getFeatures()[0] && farmSource.getFeatures()[0].getGeometry().getExtent()[0] !== Infinity) {
            clipped = _transform.erase(featureToClip, farmSource.getFeatures()[0]);
            _addFeature(_activeLayer, clipped, properties);
            clipped = _transform.merge(farmSource.getFeatures());
        }
        _remove(farmSource.getFeatures(), false);
        result = _addFeature(_activeLayer, clipped, properties);
        _clearSelections();
        return result;
    }
    function _merge(features) {
        $log.info("merging features ...", features);
        _remove(features, false);
        _addFeature(_activeLayer, _transform.merge(features));
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
        if (!_isDefined(_mode) || _mode === "edit" || _mode === "measure") {
            return;
        }
        $log.info("editing enabled");
        _mode = "edit";
        _select.enable();
        _modify.enable();
        _draw.disable();
    }
    function _enableDrawing() {
        if (!_isDefined(_mode) || _mode === "draw" || _mode === "measure") {
            return;
        }
        $log.info("drawing enabled");
        _mode = "draw";
        _select.disable();
        _modify.disable();
        _draw.enable(_mode);
    }
    function _enableDonutDrawing() {
        if (!_isDefined(_mode) || _mode === "donut-draw") {
            return;
        }
        $log.info("donut drawing enabled");
        _donutContainer = _selectedFeatures().item(0);
        _mode = "donut-draw";
        _select.disable();
        _modify.disable();
        _draw.enable(_mode);
    }
    function _snapParcels(parcels) {
        if (!_isDefined(parcels) || !_isDefined(_snap)) {
            $log.error("Snap interaction is undefined, select a layer to start!");
            return;
        }
        _snap.addFeatures(parcels);
    }
    function _clearSelections() {
        _select.interaction.getFeatures().clear();
    }
    function _isDrawing() {
        if (!_isDefined(_mode)) {
            return;
        }
        return _draw.isDrawing();
    }
    function _finishDrawing() {
        if (!_isDefined(_mode)) {
            return;
        }
        _draw.finish();
    }
    function _discardDrawing() {
        if (!_isDefined(_mode)) {
            return;
        }
        _draw.discard();
        _selectedFeatures().clear();
    }
    function _isEditing() {
        if (!_isDefined(_mode)) {
            return;
        }
        return _select.interaction.getFeatures().getLength() > 0;
    }
    function _disableSnapping() {
        if (!_isDefined(_snap)) {
            return;
        }
        return _snap.disable();
    }
    function _isSnappingActive() {
        if (!_isDefined(_snap)) {
            return;
        }
        return _snap.interaction.getActive();
    }
    function _enableSnapping() {
        if (!_isDefined(_snap)) {
            return;
        }
        return _snap.enable();
    }
    $rootScope.$on("web-mapping-measure-start", function(event, data) {
        if (!_isDefined(_select) || !_isDefined(_modify) || !_isDefined(_draw)) {
            return;
        }
        _select.disable();
        _modify.disable();
        _draw.disable();
        _mode = "measure";
    });
    $rootScope.$on("web-mapping-measure-end", function(event, data) {
        if (!_isDefined(_select) || !_isDefined(_modify) || !_isDefined(_draw)) {
            return;
        }
        _select.enable();
        _modify.enable();
        _draw.disable();
        _mode = "edit";
    });
    $rootScope.$on("web-mapping-draw-end", function(event, feature) {
        $log.info("draw end ...");
        _clip(feature, _farmLayerGroup);
    });
    $rootScope.$on("web-mapping-donut-draw-end", function(event, feature) {
        $log.info("donut draw end ...");
        _select.interaction.getFeatures().push(_clip(feature, _farmLayerGroup));
        _donutContainer = null;
    });
    function _enableKeyboardShortcuts() {
        var element = _map.getTargetElement();
        element.tabIndex = 0;
        function onKeyDown(event) {
            var selectedFeatures = _selectedFeatures();
            if (!_isDefined(selectedFeatures)) {
                return;
            }
            if (event.keyCode == 46 || event.keyCode == 8) {
                _remove(selectedFeatures);
                event.preventDefault();
                event.stopPropagation();
                return false;
            }
            if (event.keyCode == 13) {
                if (_isDrawing()) {
                    _finishDrawing();
                } else {
                    _clip(_selectedFeatures().item(0), _farmLayerGroup);
                }
                event.preventDefault();
                event.stopPropagation();
                return false;
            }
            if (event.keyCode == 27) {
                if (_isDrawing()) {
                    _discardDrawing();
                    event.preventDefault();
                    event.stopPropagation();
                    return false;
                }
            }
        }
        element.addEventListener("keydown", onKeyDown);
    }
    return {
        init: _init,
        destroy: _destroy,
        editing: {
            enable: _enableEditing,
            isEditing: _isEditing
        },
        drawing: {
            discard: _discardDrawing,
            finish: _finishDrawing,
            enable: _enableDrawing,
            isDrawing: _isDrawing
        },
        donut: {
            enable: _enableDonutDrawing
        },
        snapping: {
            enable: _enableSnapping,
            disable: _disableSnapping,
            active: _isSnappingActive
        },
        features: {
            selections: _selectedFeatures,
            clip: _clip,
            merge: _merge,
            remove: _remove
        },
        parcels: {
            snap: _snapParcels
        },
        keyboardShortcuts: {
            enable: _enableKeyboardShortcuts
        }
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

angular.module("farmbuild.webmapping").factory("webMappingSelectInteraction", function(validations, $rootScope, $log) {
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
            selectInteraction.getFeatures().on("change:length", function() {
                var selections = selectInteraction.getFeatures();
                if (selections.getLength() > 0) {
                    $rootScope.$broadcast("web-mapping-feature-select", selectInteraction.getFeatures().item(0));
                    return;
                }
                $rootScope.$broadcast("web-mapping-feature-deselect");
            });
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
        if (!_isDefined(map) || !_isDefined(farmSource) || !_isDefined(paddocksSource)) {
            $log.error("There is a problem with input parameters, please refer to api for more information");
            return;
        }
        var snapInteraction = new ol.interaction.Snap({
            source: paddocksSource
        }), snapVisibleLayer;
        snapInteraction.addFeature(farmSource.getFeatures()[0]);
        function _enable() {
            snapInteraction.setActive(true);
        }
        function _disable() {
            snapInteraction.setActive(false);
        }
        snapVisibleLayer = new ol.layer.Vector({
            source: new ol.source.Vector(),
            title: "Rural Parcels",
            style: new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: "rgba(238,238,238,.7)",
                    width: 1
                })
            })
        });
        map.addLayer(snapVisibleLayer);
        function _addFeatures(parcels) {
            parcels.forEach(function(parcel) {
                snapInteraction.addFeature(parcel);
            });
            snapVisibleLayer.getSource().addFeatures(parcels);
        }
        function _init(active) {
            $log.info("snap interaction init ...");
            map.addInteraction(snapInteraction);
            snapInteraction.setActive(active);
        }
        function _destroy(map) {
            if (!_isDefined(map)) {
                $log.error("There is a problem with input parameters, map object is not defined");
                return;
            }
            map.removeLayer(snapVisibleLayer);
            map.removeInteraction(snapInteraction);
        }
        return {
            init: _init,
            enable: _enable,
            disable: _disable,
            addFeatures: _addFeatures,
            interaction: snapInteraction,
            destroy: _destroy
        };
    }
    return {
        create: _create
    };
});

"use strict";

angular.module("farmbuild.webmapping").factory("webMappingMeasurement", function(validations, webMappingConverter, $log) {
    var _isDefined = validations.isDefined, _converter = webMappingConverter;
    function _areas(features) {
        $log.info("calculating area of features ...", features);
        try {
            return turf.area(features) * 1e-4;
        } catch (e) {
            $log.error(e);
        }
    }
    function _area(feature, dataProjection, featureProjection) {
        $log.info("calculating area of polygon ...", feature);
        feature = _converter.featureToGeoJson(feature, dataProjection, featureProjection);
        try {
            return turf.area(feature) * 1e-4;
        } catch (e) {
            $log.error(e);
        }
    }
    function _length(feature, dataProjection, featureProjection) {
        $log.info("calculating length of line ...", feature);
        feature = _converter.featureToGeoJson(feature, dataProjection, featureProjection);
        try {
            return turf.lineDistance(feature, "kilometers") * 1e3;
        } catch (e) {
            $log.error(e);
        }
    }
    return {
        area: _area,
        areas: _areas,
        length: _length
    };
});

"use strict";

angular.module("farmbuild.webmapping").factory("webMappingOpenLayersHelper", function(validations, webMappingMeasureControl, webMappingSnapControl, webMappingGoogleAddressSearch, webMappingLayerSwitcherControl, webMappingTransformation, webMappingConverter, $log) {
    var _isDefined = validations.isDefined, _googleProjection = "EPSG:3857", _ZoomToExtentControl, _transform = webMappingTransformation, _converter = webMappingConverter;
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
        map.addControl(new webMappingMeasureControl.create(map, "Polygon", dataProjection));
        map.addControl(new webMappingMeasureControl.create(map, "LineString", dataProjection));
        map.addControl(new webMappingSnapControl.create());
        map.addControl(new ol.control.LayerSwitcher({
            tipLabel: "Switch on/off farm layers"
        }));
    }
    function _initWithGoogleMap(map, dataProjection, extent, gmap, targetElement) {
        if (!_isDefined(gmap) || !_isDefined(map) || !_isDefined(dataProjection)) {
            return;
        }
        $log.info("integrating google map ...");
        var view = map.getView();
        view.on("change:center", function() {
            var center = ol.proj.transform(view.getCenter(), _googleProjection, dataProjection);
            gmap.setCenter(new google.maps.LatLng(center[1], center[0]));
        });
        view.on("change:resolution", function() {
            gmap.setZoom(view.getZoom());
        });
        window.onresize = function() {
            var center = _transform.toGoogleLatLng(view.getCenter(), dataProjection);
            google.maps.event.trigger(gmap, "resize");
            gmap.setCenter(center);
        };
        _init(map, dataProjection, extent);
        addControlsToGmap(gmap, targetElement);
    }
    function _init(map, dataProjection, extent) {
        var defaults = {
            centerNew: [ -36.22488327137526, 145.5826132801325 ],
            zoomNew: 6
        };
        var view = map.getView();
        $log.info("farm extent: %j", extent);
        if (extent[0] === Infinity) {
            view.setCenter(ol.proj.transform([ defaults.centerNew[1], defaults.centerNew[0] ], dataProjection, _googleProjection));
            view.setZoom(defaults.zoomNew);
        } else {
            view.fitExtent(extent, map.getSize());
        }
        addControlsToOlMap(map, extent, dataProjection);
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
                        name: dataProjection
                    }
                };
            });
            return result;
        } catch (e) {
            $log.error(e);
        }
    }
    function _center(coordinates, map) {
        if (!_isDefined(coordinates) || !_isDefined(map)) {
            return;
        }
        $log.info("centring view ...");
        map.getView().setCenter(coordinates);
        map.getView().setZoom(15);
    }
    function _createPaddocksLayer(paddocksGeometry, dataProjection, featureProjection) {
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
            title: "Paddocks",
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
    function _createFarmLayer(farmGeometry, dataProjection, featureProjection) {
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
            title: "Farm",
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
    function _createFarmLayers(geometry, dataProjection, featureProjection) {
        return new ol.layer.Group({
            title: "Farm layers",
            layers: [ _createPaddocksLayer(geometry.paddocks, dataProjection, featureProjection), _createFarmLayer(geometry.farm, dataProjection, featureProjection) ]
        });
    }
    function _createBaseLayers() {
        var vicMapImageryLayer = new ol.layer.Tile({
            title: "VicMAP Imagery",
            type: "base",
            visible: true,
            source: new ol.source.TileWMS({
                url: "http://api.maps.vic.gov.au/vicmapapi-mercator/map-wm/wms",
                params: {
                    LAYERS: "SATELLITE_WM",
                    VERSION: "1.1.1"
                }
            })
        }), vicMapStreetLayer = new ol.layer.Tile({
            title: "VicMAP Street",
            type: "base",
            visible: false,
            source: new ol.source.TileWMS({
                url: "http://api.maps.vic.gov.au/vicmapapi-mercator/map-wm/wms",
                params: {
                    LAYERS: "WEB_MERCATOR",
                    VERSION: "1.1.1"
                }
            })
        });
        return new ol.layer.Group({
            title: "Base maps",
            layers: [ vicMapImageryLayer, vicMapStreetLayer ]
        });
    }
    function _createBaseLayersWithGoogleMaps() {
        var vicMapImageryLayer = new ol.layer.Tile({
            title: "VicMAP Imagery",
            type: "base",
            visible: false,
            source: new ol.source.TileWMS({
                url: "http://api.maps.vic.gov.au/vicmapapi-mercator/map-wm/wms",
                params: {
                    LAYERS: "SATELLITE_WM",
                    VERSION: "1.1.1"
                }
            })
        }), vicMapStreetLayer = new ol.layer.Tile({
            title: "VicMAP Street",
            type: "base",
            visible: false,
            source: new ol.source.TileWMS({
                url: "http://api.maps.vic.gov.au/vicmapapi-mercator/map-wm/wms",
                params: {
                    LAYERS: "WEB_MERCATOR",
                    VERSION: "1.1.1"
                }
            })
        }), googleImageryLayer = new ol.layer.Tile({
            title: "Google Imagery",
            type: "base",
            visible: true
        }), googleStreetLayer = new ol.layer.Tile({
            title: "Google Street",
            type: "base",
            visible: false
        });
        return new ol.layer.Group({
            title: "Base maps",
            layers: [ vicMapImageryLayer, vicMapStreetLayer, googleStreetLayer, googleImageryLayer ]
        });
    }
    function _reload(map, geoJsons, dataProjection, featureProjection) {
        var farmLayers = map.getLayers().item(1).getLayers(), farmSource = farmLayers.item(1).getSource(), paddocksSource = farmLayers.item(0).getSource(), farmFeatures = _converter.geoJsonToFeatures(geoJsons.farm, dataProjection, featureProjection), paddockFeatures = _converter.geoJsonToFeatures(geoJsons.paddocks, dataProjection, featureProjection);
        farmSource.clear();
        paddocksSource.clear();
        farmSource.addFeatures(farmFeatures);
        paddocksSource.addFeatures(paddockFeatures);
    }
    function _initGoogleAddressSearch(textInputElement, olmap) {
        if (!_isDefined(textInputElement) || !_isDefined(olmap)) {
            return;
        }
        $log.info("init google address search ...", textInputElement);
        function onPlaceChanged(latLng) {
            latLng = _transform.fromGoogleLatLng(latLng);
            _center(latLng, olmap);
        }
        webMappingGoogleAddressSearch.init(textInputElement, onPlaceChanged);
    }
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
    }
    function _farmLayer(map) {
        if (!_isDefined(map) || !_isDefined(map.getLayers().item(1)) || !_isDefined(map.getLayers().item(1).getLayers() || !_isDefined(map.getLayers().item(1).getLayers().getLength() === 2))) {
            return;
        }
        return map.getLayers().item(1).getLayers().item(1);
    }
    function _paddocksLayer(map) {
        if (!_isDefined(map) || !_isDefined(map.getLayers().item(1)) || !_isDefined(map.getLayers().item(1).getLayers() || !_isDefined(map.getLayers().item(1).getLayers().getLength() === 2))) {
            return;
        }
        return map.getLayers().item(1).getLayers().item(0);
    }
    function _farmLayerGroup(map) {
        if (!_isDefined(map) || !_isDefined(map.getLayers().item(1))) {
            return;
        }
        return map.getLayers().item(1);
    }
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
    };
});

angular.module("farmbuild.webmapping").constant("paddockGroupDefaults", {
    groups: [ "N/A - Type Not Set", "E - Effluent", "N - Night Paddocks", "A - Average Use and Soil Type Paddock", "UL - Usually Harvested, Limited Feeding Back", "UF - Usually Harvested, Usually Fed Back", "NL - Never Harvested and Limited Feeding Back", "NF - Never Harvested and Usually Fed Back", "NL1 - 1st Variation of NL", "NL2 - 2nd Variation of NL", "NF1 - 1st Variation of NF", "NF2 - 2nd Variation of NF", "UL1 - 1st Variation of UL", "UF1 - 1st Variation of UF", "C - Crop", "FC - Future Crop", "O - Other", "O1 - 1st Variation of O" ]
});

"use strict";

angular.module("farmbuild.webmapping").factory("webMappingPaddocks", function($log, validations, paddockTypeDefaults, paddockGroupDefaults) {
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
        findByCoordinate: _findByCoordinate,
        types: function() {
            return paddockTypeDefaults.types;
        },
        groups: function() {
            return paddockGroupDefaults.groups;
        }
    };
});

angular.module("farmbuild.webmapping").constant("paddockTypeDefaults", {
    types: [ "Annual Pasture", "Bull Paddock", "Calving paddocks", "Calf Rearing Area", "Dairy", "Effluent Paddocks", "Feedpad", "Lucerne", "Other Crops", "Permanent Pasture", "Springer Paddock", "Sumer Crops" ]
});

"use strict";

angular.module("farmbuild.webmapping").factory("webMappingParcels", function($log, $http, validations, webMappingInteractions, webMappingConverter) {
    var _isDefined = validations.isDefined, converter = webMappingConverter;
    function _load(serviceUrl, extent, extentDataProjection, responseProjection) {
        var config = {
            params: {
                service: "WFS",
                version: "1.0.0",
                request: "GetFeature",
                typeName: "farmbuild:parcels",
                outputFormat: "text/javascript",
                format_options: "callback:JSON_CALLBACK",
                srsname: responseProjection,
                bbox: extent.join(",") + "," + extentDataProjection
            }
        };
        if (!_isDefined(serviceUrl) || !_isDefined(extent) || !_isDefined(extentDataProjection) || !_isDefined(responseProjection)) {
            $log.error("There is a problem with input parameters, please refer to api for more information");
            return;
        }
        $log.info("Loading parcels information for the extent: ", extent);
        return $http({
            method: "JSONP",
            url: serviceUrl,
            params: config.params
        }).success(function(data, status) {
            $log.info("loaded parcels successfully.", status, data);
            var olFeatures = converter.geoJsonToFeatures({
                type: "FeatureCollection",
                features: data.features
            });
            webMappingInteractions.parcels.snap(olFeatures);
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
        farmData.area = webMappingMeasurement.areas(geoJsons.farm);
        farmData.name = geoJsons.farm.features[0].properties.name;
        $log.info("new geoJson", geoJsons);
        return farmdata.merge(farmData, geoJsons);
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
    var _isDefined = validations.isDefined, _openLayersDefaultProjection = "EPSG:4326", _googleProjection = "EPSG:3857";
    function _transformToGoogleLatLng(latLng, destinationProjection) {
        if (!_isDefined(latLng) || !_isDefined(destinationProjection)) {
            return;
        }
        var transformed = ol.proj.transform(latLng, _googleProjection, destinationProjection);
        return new google.maps.LatLng(transformed[1], transformed[0]);
    }
    function _transformFromGoogleLatLng(latLng) {
        if (!_isDefined(latLng)) {
            return;
        }
        return ol.proj.transform([ latLng.lng(), latLng.lat() ], _openLayersDefaultProjection, _googleProjection);
    }
    return {
        fromGoogleLatLng: _transformFromGoogleLatLng,
        toGoogleLatLng: _transformToGoogleLatLng
    };
});

"use strict";

angular.module("farmbuild.webmapping").factory("webMappingLayerSwitcherControl", function(validations, $rootScope, $log) {
    ol.control.LayerSwitcher = function(opt_options) {
        var options = opt_options || {};
        var tipLabel = options.tipLabel ? options.tipLabel : "Legend";
        this.mapListeners = [];
        this.hiddenClassName = "ol-unselectable ol-control layer-switcher";
        this.shownClassName = this.hiddenClassName + " shown";
        var element = document.createElement("div");
        element.className = this.hiddenClassName;
        var button = document.createElement("button");
        button.setAttribute("title", tipLabel);
        element.appendChild(button);
        this.panel = document.createElement("div");
        this.panel.className = "panel";
        element.appendChild(this.panel);
        var this_ = this;
        element.onmouseover = function(e) {
            this_.showPanel();
        };
        button.onclick = function(e) {
            this_.showPanel();
        };
        element.onmouseout = function(e) {
            e = e || window.event;
            if (!element.contains(e.toElement)) {
                this_.hidePanel();
            }
        };
        ol.control.Control.call(this, {
            element: element,
            target: options.target
        });
    };
    ol.inherits(ol.control.LayerSwitcher, ol.control.Control);
    ol.control.LayerSwitcher.prototype.showPanel = function() {
        if (this.element.className != this.shownClassName) {
            this.element.className = this.shownClassName;
            this.renderPanel();
        }
    };
    ol.control.LayerSwitcher.prototype.hidePanel = function() {
        if (this.element.className != this.hiddenClassName) {
            this.element.className = this.hiddenClassName;
        }
    };
    ol.control.LayerSwitcher.prototype.renderPanel = function() {
        this.ensureTopVisibleBaseLayerShown_();
        while (this.panel.firstChild) {
            this.panel.removeChild(this.panel.firstChild);
        }
        var ul = document.createElement("ul");
        this.panel.appendChild(ul);
        this.renderLayers_(this.getMap(), ul);
    };
    ol.control.LayerSwitcher.prototype.setMap = function(map) {
        for (var i = 0, key; i < this.mapListeners.length; i++) {
            this.getMap().unByKey(this.mapListeners[i]);
        }
        this.mapListeners.length = 0;
        ol.control.Control.prototype.setMap.call(this, map);
        if (map) {
            var this_ = this;
            this.mapListeners.push(map.on("pointerdown", function() {
                this_.hidePanel();
            }));
            this.renderPanel();
        }
    };
    ol.control.LayerSwitcher.prototype.ensureTopVisibleBaseLayerShown_ = function() {
        var lastVisibleBaseLyr;
        ol.control.LayerSwitcher.forEachRecursive(this.getMap(), function(l, idx, a) {
            if (l.get("type") === "base" && l.getVisible()) {
                lastVisibleBaseLyr = l;
            }
        });
        if (lastVisibleBaseLyr) this.setVisible_(lastVisibleBaseLyr, true);
    };
    ol.control.LayerSwitcher.prototype.setVisible_ = function(lyr, visible) {
        var map = this.getMap();
        lyr.setVisible(visible);
        if (visible && lyr.get("type") === "base") {
            ol.control.LayerSwitcher.forEachRecursive(map, function(l, idx, a) {
                if (l != lyr && l.get("type") === "base") {
                    l.setVisible(false);
                }
            });
        }
    };
    ol.control.LayerSwitcher.prototype.renderLayer_ = function(lyr, idx) {
        var this_ = this;
        var li = document.createElement("li");
        var lyrTitle = lyr.get("title");
        var lyrId = lyr.get("title").replace(" ", "-") + "_" + idx;
        var label = document.createElement("label");
        if (lyr.getLayers) {
            li.className = "group";
            label.innerHTML = lyrTitle;
            li.appendChild(label);
            var ul = document.createElement("ul");
            li.appendChild(ul);
            this.renderLayers_(lyr, ul);
        } else {
            var input = document.createElement("input");
            if (lyr.get("type") === "base") {
                input.type = "radio";
                input.name = "base";
            } else {
                input.type = "checkbox";
            }
            input.id = lyrId;
            input.checked = lyr.get("visible");
            input.onchange = function(e) {
                $rootScope.$broadcast("web-mapping-base-layer-change", {
                    layer: lyr
                });
                this_.setVisible_(lyr, e.target.checked);
            };
            li.appendChild(input);
            label.htmlFor = lyrId;
            label.innerHTML = lyrTitle;
            li.appendChild(label);
        }
        return li;
    };
    ol.control.LayerSwitcher.prototype.renderLayers_ = function(lyr, elm) {
        var lyrs = lyr.getLayers().getArray().slice().reverse();
        for (var i = 0, l; i < lyrs.length; i++) {
            l = lyrs[i];
            if (l.get("title")) {
                elm.appendChild(this.renderLayer_(l, i));
            }
        }
    };
    ol.control.LayerSwitcher.forEachRecursive = function(lyr, fn) {
        lyr.getLayers().forEach(function(lyr, idx, a) {
            fn(lyr, idx, a);
            if (lyr.getLayers) {
                ol.control.LayerSwitcher.forEachRecursive(lyr, fn);
            }
        });
    };
    return {};
});

"use strict";

angular.module("farmbuild.webmapping").factory("webMappingMeasureControl", function(validations, webMappingMeasurement, $rootScope, $log) {
    var _isDefined = validations.isDefined, _measurement = webMappingMeasurement;
    function _create(map, type, dataProjection) {
        var source = new ol.source.Vector(), baseCssClass = "measure ol-unselectable ol-control ", drawInteraction = new ol.interaction.Draw({
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
        var letter, cssClass, options = {};
        if (type == "Polygon") {
            letter = "A";
            cssClass = "area";
        } else {
            letter = "L";
            cssClass = "length";
        }
        drawInteraction.on("drawend", function(evt) {
            if (type == "Polygon") {
                $rootScope.$broadcast("web-mapping-measure-end", {
                    value: _measurement.area(evt.feature, dataProjection, map.getView().getProjection()),
                    unit: "hectares"
                });
            } else {
                $rootScope.$broadcast("web-mapping-measure-end", {
                    value: _measurement.length(evt.feature, dataProjection, map.getView().getProjection()),
                    unit: "metres"
                });
            }
            drawInteraction.setActive(false);
            document.getElementsByClassName(baseCssClass + cssClass)[0].className = baseCssClass + cssClass;
        }, this);
        map.addInteraction(drawInteraction);
        drawInteraction.setActive(false);
        function _measureControl(type) {
            var button = document.createElement("button");
            button.innerHTML = letter;
            var handleMeasure = function(e) {
                drawInteraction.setActive(!drawInteraction.getActive());
                element.className = baseCssClass + cssClass + (drawInteraction.getActive() ? " active" : "");
                $rootScope.$broadcast("web-mapping-measure-start");
            };
            button.addEventListener("click", handleMeasure, false);
            button.addEventListener("touchstart", handleMeasure, false);
            var element = document.createElement("div");
            element.className = baseCssClass + cssClass;
            element.title = "Measure " + cssClass;
            element.appendChild(button);
            ol.control.Control.call(this, {
                element: element,
                target: options.target
            });
        }
        ol.inherits(_measureControl, ol.control.Control);
        return new _measureControl(type);
    }
    return {
        create: _create
    };
});

"use strict";

angular.module("farmbuild.webmapping").factory("webMappingSnapControl", function(validations, $rootScope, $log) {
    var _isDefined = validations.isDefined;
    function _create() {
        var baseCssClass = "snap ol-unselectable ol-control ";
        var letter = "S", options = {};
        var button = document.createElement("button");
        button.innerHTML = letter;
        function toggle(e) {
            var eventToCast;
            if (farmbuild.webmapping.actions.snapping.active()) {
                farmbuild.webmapping.actions.snapping.disable();
                eventToCast = "web-mapping-snap-disabled";
                element.className = baseCssClass;
                element.title = "Enable snapping";
            } else {
                farmbuild.webmapping.actions.snapping.enable();
                eventToCast = "web-mapping-snap-enabled";
                element.className = baseCssClass + "active";
                element.title = "Disable snapping";
            }
            $rootScope.$broadcast(eventToCast);
        }
        button.addEventListener("click", toggle, false);
        button.addEventListener("touchstart", toggle, false);
        var element = document.createElement("div");
        element.className = baseCssClass + " active";
        element.title = "Disable snapping";
        element.appendChild(button);
        ol.control.Control.call(this, {
            element: element,
            target: options.target
        });
    }
    ol.inherits(_create, ol.control.Control);
    return {
        create: _create
    };
});

"use strict";

angular.module("farmbuild.webmapping").factory("webMappingGoogleAddressSearch", function(validations, $log) {
    var countryRestrict = {
        country: "au"
    }, _isDefined = validations.isDefined;
    function _init(targetElementId, onPlaceChangedCallback) {
        if (!_isDefined(google) || !_isDefined(google.maps) || !_isDefined(google.maps.places)) {
            $log.error("google.maps.places is not defined, please make sure that you have included google places library in your html page.");
            return;
        }
        if (!_isDefined(targetElementId) || !_isDefined(onPlaceChangedCallback)) {
            return;
        }
        var autocomplete = new google.maps.places.Autocomplete(document.getElementById(targetElementId), {
            componentRestrictions: countryRestrict
        });
        google.maps.event.addListener(autocomplete, "place_changed", function() {
            _onPlaceChanged(autocomplete, onPlaceChangedCallback);
        });
    }
    function _onPlaceChanged(autocomplete, onPlaceChangedCallback) {
        var place = autocomplete.getPlace(), latLng;
        if (!place.geometry) {
            return;
        }
        latLng = place.geometry.location;
        if (_isDefined(onPlaceChangedCallback) && typeof onPlaceChangedCallback === "function") {
            onPlaceChangedCallback(latLng);
        }
    }
    return {
        init: _init
    };
});

"use strict";

angular.module("farmbuild.webmapping").factory("webMappingGoogleAnalytics", function($log, validations, googleAnalytics) {
    var api = "farmbuild-webmapping", _isDefined = validations.isDefined;
    function _trackWebMapping(clientName) {
        if (!_isDefined(clientName)) {
            $log.error("client name is not specified");
            return;
        }
        $log.info("googleAnalyticsWebMapping.trackWebMapping clientName: %s", clientName);
        googleAnalytics.track(api, clientName);
    }
    return {
        trackWebMapping: _trackWebMapping
    };
});

"use strict";

angular.module("farmbuild.webmapping").run(function(webmapping) {});

angular.injector([ "ng", "farmbuild.webmapping" ]);
'use strict';

describe('farmbuild.webMapping module', function () {

    // instantiate service
    var webMappingGeoProcessing, webMapping, olHelper,
        $log,
        poly1 = {
            "type": "Feature",
            "properties": {
                "name": "P1"
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [-46.738586, -23.596711],
                    [-46.738586, -23.458207],
                    [-46.560058, -23.458207],
                    [-46.560058, -23.596711],
                    [-46.738586, -23.596711]
                ]]
            }
        },
        poly2 = {
            "type": "Feature",
            "properties": {
                "name": "P2"
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [-46.650009, -23.631314],
                    [-46.650009, -23.5237],
                    [-46.509246, -23.5237],
                    [-46.509246, -23.631314],
                    [-46.650009, -23.631314]
                ]]
            }
        },
        polys1 = {type: 'FeatureCollection', features: [poly1, poly2]},
        polys2 = {type: 'FeatureCollection', features: [poly2]};

    beforeEach(module('farmbuild.webmapping', function ($provide) {
        $provide.value('$log', console);
    }));

    beforeEach(inject(function (_webMappingGeoProcessing_, _webmapping_,
                                _$log_) {
        webMappingGeoProcessing = _webMappingGeoProcessing_;
        webMapping = _webmapping_;
        olHelper = webMapping.olHelper;
        $log = _$log_;
    }));

    describe('Testing Web Mapping Transformation', function () {
        it('webMappingTransformation should be defined', inject(function () {
            expect(webMapping).toBeDefined();
            expect(webMappingTransformation).toBeDefined();
        }));
    });

    describe('Testing Web Mapping EraseAll Transformation, removing a polygon from itself should return undefined', function () {
        it('webMappingTransformation.erase should return a Feature<Polygon>', inject(function () {
            var olPoly1,
                olPolys,
                erased;
            olPoly1 = olHelper.geoJsonToFeature(poly1);
            olPolys = olHelper.geoJsonToFeatures(polys1);
            erased = webMappingTransformation.eraseAll(olPoly1, olPolys);
            expect(erased).toBeUndefined();
        }));
    });

    describe('Testing Web Mapping EraseAll Transformation', function () {
        it('webMappingTransformation.erase should return a Feature<Polygon>', inject(function () {
            var olPoly1,
                olPolys,
                erased,
                erasedGeoJSON,
                expected = {
                    "type": "Feature",
                    "properties": {
                        "name": "P1"
                    },
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[
                            [-46.738586, -23.596711],
                            [-46.738586, -23.458207],
                            [-46.560058, -23.458207],
                            [-46.560058, -23.5237],
                            [-46.650009, -23.5237],
                            [-46.650009, -23.596711],
                            [-46.738586, -23.596711]
                        ]]
                    }
                };
            olPoly1 = olHelper.geoJsonToFeature(poly1);
            olPolys = olHelper.geoJsonToFeatures(polys2);
            erased = webMappingTransformation.eraseAll(olPoly1, olPolys);
            erasedGeoJSON = olHelper.featureToGeoJson(erased);
            expect(erased).toBeDefined();
            expect(erasedGeoJSON).toBeDefined();
            expect(erasedGeoJSON).toEqual(expected);
        }));
    });

    describe('Testing Web Mapping Erase Transformation', function () {
        it('webMappingTransformation.erase should return a Feature<Polygon>', inject(function () {
            var olPoly1,
                olPoly2,
                erased,
                erasedGeoJSON,
                expected = {
                    "type": "Feature",
                    "properties": {
                        "name": "P1"
                    },
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[
                            [-46.738586, -23.596711],
                            [-46.738586, -23.458207],
                            [-46.560058, -23.458207],
                            [-46.560058, -23.5237],
                            [-46.650009, -23.5237],
                            [-46.650009, -23.596711],
                            [-46.738586, -23.596711]
                        ]]
                    }
                };
            olPoly1 = olHelper.geoJsonToFeature(poly1);
            olPoly2 = olHelper.geoJsonToFeature(poly2);
            erased = webMappingTransformation.erase(olPoly1, olPoly2);
            erasedGeoJSON = olHelper.featureToGeoJson(erased);
            expect(erased).toBeDefined();
            expect(erasedGeoJSON).toBeDefined();
            expect(erasedGeoJSON).toEqual(expected);
        }));
    });

    describe('Testing Web Mapping Merge Transformation', function () {
        it('webMappingTransformation.erase should return a Feature<Polygon>', inject(function () {
            var polygons = {
                    "type": "FeatureCollection",
                    "features": [
                        {
                            "type": "Feature",
                            "properties": {
                                "fill": "#0f0"
                            },
                            "geometry": {
                                "type": "Polygon",
                                "coordinates": [[
                                    [9.994812, 53.549487],
                                    [10.046997, 53.598209],
                                    [10.117721, 53.531737],
                                    [9.994812, 53.549487]
                                ]]
                            }
                        }, {
                            "type": "Feature",
                            "properties": {
                                "fill": "#00f"
                            },
                            "geometry": {
                                "type": "Polygon",
                                "coordinates": [[
                                    [10.000991, 53.50418],
                                    [10.03807, 53.562539],
                                    [9.926834, 53.551731],
                                    [10.000991, 53.50418]
                                ]]
                            }
                        }
                    ]
                },
                olPolygons,
                merged,
                mergedGeoJSON,
                expected = {
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[
                                [10.005390809136088, 53.55936379867258],
                                [10.046997, 53.598209],
                                [10.117721, 53.531737],
                                [10.026838636912657, 53.54486184801601],
                                [10.000991, 53.50418],
                                [9.926834, 53.551731],
                                [10.005390809136088, 53.55936379867258]
                            ]
                        ]
                    },
                    "properties": {
                        "fill": "#0f0"
                    }
                };
            olPolygons = olHelper.geoJsonToFeatures(polygons);
            merged = webMappingTransformation.merge(olPolygons);
            mergedGeoJSON = olHelper.featureToGeoJson(merged);
            expect(merged).toBeDefined();
            expect(mergedGeoJSON).toBeDefined();
            expect(mergedGeoJSON).toEqual(expected);
        }));
    });

    describe('Testing Web Mapping Intersect Transformation', function () {
        it('webMappingTransformation.erase should return a Feature<Polygon>', inject(function () {

            var poly1 = {
                    "type": "Feature",
                    "properties": {
                        "fill": "#0f0"
                    },
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[
                                [-122.801742, 45.48565],
                                [-122.801742, 45.60491],
                                [-122.584762, 45.60491],
                                [-122.584762, 45.48565],
                                [-122.801742, 45.48565]
                            ]
                        ]
                    }
                },
                poly2 =  {
                    "type": "Feature",
                    "properties": {
                        "fill": "#00f"
                    },
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[
                                [-122.520217, 45.535693],
                                [-122.64038, 45.553967],
                                [-122.720031, 45.526554],
                                [-122.669906, 45.507309],
                                [-122.723464, 45.446643],
                                [-122.532577, 45.408574],
                                [-122.487258, 45.477466],
                                [-122.520217, 45.535693]
                            ]
                        ]
                    }
                },
                olPolygon1,
                olPolygon2,
                intersection,
                intersectedGeoJSON,
                expected = {
                    "type": "Feature",
                    "properties": null,
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[
                                [-122.584762, 45.545508794628965],
                                [-122.584762, 45.48565],
                                [-122.68902729894835, 45.48565],
                                [-122.669906, 45.507309],
                                [-122.720031, 45.526554],
                                [-122.64038, 45.553967],
                                [-122.584762, 45.545508794628965]
                            ]
                        ]
                    }
                };
            olPolygon1 = olHelper.geoJsonToFeature(poly1);
            olPolygon2 = olHelper.geoJsonToFeature(poly2);
            intersection = webMappingTransformation.intersect(olPolygon1, olPolygon2);
            intersectedGeoJSON = olHelper.featureToGeoJson(intersection);
            expect(intersection).toBeDefined();
            expect(intersectedGeoJSON).toBeDefined();
            expect(intersectedGeoJSON).toEqual(expected);
        }));
    });

});

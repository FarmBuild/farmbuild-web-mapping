'use strict';

angular.module('farmbuild.webmapping')
    .factory('webMappingGeoProcessing',
    function (validations,
              webMappingOpenLayersHelper,
              $log) {
        var _isDefined = validations.isDefined,
            olHelper = webMappingOpenLayersHelper;

        function _eraseAll(clipee, clippers) {
            if (!_isDefined(clipee) || !_isDefined(clippers)) {
                return;
            }
            $log.info('erasing feature', clipee);
            var clipeeGeoJson = olHelper.featureToGeoJson(clipee);
            clippers.forEach(function (clipper) {
                var clipperGeoJson = olHelper.featureToGeoJson(clipper);
                try {
                    clipeeGeoJson = turf.erase(clipeeGeoJson, clipperGeoJson);
                } catch (e) {
                    $log.error(e);
                }
            });
            return olHelper.geoJsonToFeature(clipeeGeoJson);
        };

        function _erase(clipee, clipper) {
            if (!_isDefined(clipee) || !_isDefined(clipper)) {
                return;
            }
            $log.info('erasing feature 2 from 1', clipee, clipper);
            var clipeeGeoJson = olHelper.featureToGeoJson(clipee),
                cliperGeoJson = olHelper.featureToGeoJson(clipper),
                clipped;
            try {
                clipped = turf.erase(clipeeGeoJson, cliperGeoJson);
                return olHelper.geoJsonToFeature(clipped);
            } catch (e) {
                $log.error(e);
            }
        };

        function _intersect(olFeature1, olFeature2) {
            $log.info('intersecting feature', olFeature1, olFeature2);
            var feature1 = olHelper.featureToGeoJson(olFeature1),
                feature2 = olHelper.featureToGeoJson(olFeature2),
                intersection;
            try {
                intersection = turf.intersect(feature1, feature2);
                return olHelper.geoJsonToFeature(intersection);
            } catch (e) {
                $log.error(e);
            }
        };

        function _merge(olFeatures) {
            $log.info('merging features ...', olFeatures);
            var properties, toMerge;
            toMerge = olHelper.featuresToGeoJson(olFeatures);
            properties = {name: 'merged ' + (new Date()).getTime()};
            try {
                return olHelper.geoJsonToFeature(turf.merge(toMerge), properties);
            } catch (e) {
                $log.error(e);
            }

        };

        return {
            eraseAll: _eraseAll,
            erase: _erase,
            intersect: _intersect,
            merge: _merge
        }

    });
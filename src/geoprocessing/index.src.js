/**
 * @since 0.0.1
 * @copyright 2015 Spatial Vision, Inc. http://spatialvision.com.au
 * @license The MIT License
 * @author Spatial Vision
 * @version 0.1.0
 */

'use strict';

/**
 * webmapping/geoProcessing singleton
 * @private-module webmapping/geoProcessing
 */

angular.module('farmbuild.webmapping')
    .factory('webMappingGeoProcessing',
    function (validations,
              webMappingConverter,
              $log) {
        var _isDefined = validations.isDefined,
            converter = webMappingConverter;

        function _eraseAll(clipee, clippers) {
            if (!_isDefined(clipee) || !_isDefined(clippers)) {
                return;
            }
            $log.info('erasing feature', clipee);
            var clipeeGeoJson = converter.featureToGeoJson(clipee);
            clippers.forEach(function (clipper) {
                var clipperGeoJson = converter.featureToGeoJson(clipper);
                try {
                    clipeeGeoJson = turf.erase(clipeeGeoJson, clipperGeoJson);
                } catch (e) {
                    $log.warn('This operation is not supported,', e);
                }
            });
            return converter.geoJsonToFeature(clipeeGeoJson);
        };

        function _erase(clipee, clipper) {
            if (!_isDefined(clipee) || !_isDefined(clipper)) {
                return;
            }
            $log.info('erasing feature 2 from 1', clipee, clipper);
            var clipeeGeoJson = converter.featureToGeoJson(clipee),
                cliperGeoJson = converter.featureToGeoJson(clipper),
                clipped;
            try {
                clipped = turf.erase(clipeeGeoJson, cliperGeoJson);
                return converter.geoJsonToFeature(clipped);
            } catch (e) {
                $log.warn('This operation is not supported,', e);
            }
        };

        function _intersect(olFeature1, olFeature2) {
            $log.info('intersecting feature', olFeature1, olFeature2);
            var feature1 = converter.featureToGeoJson(olFeature1),
                feature2 = converter.featureToGeoJson(olFeature2),
                intersection;
            try {
                intersection = turf.intersect(feature1, feature2);
                return converter.geoJsonToFeature(intersection);
            } catch (e) {
                $log.warn('This operation is not supported,', e);
            }
        };

        function _merge(olFeatures) {
            $log.info('merging features ...', olFeatures);
            var properties, toMerge;
            toMerge = converter.featuresToGeoJson(olFeatures);
            properties = {name: 'merged ' + (new Date()).getTime()};
            try {
                return converter.geoJsonToFeature(turf.merge(toMerge), properties);
            } catch (e) {
                $log.warn('This operation is not supported,', e);
            }

        };

        return {
            eraseAll: _eraseAll,
            erase: _erase,
            intersect: _intersect,
            merge: _merge
        }

    });
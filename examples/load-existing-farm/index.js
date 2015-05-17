angular.module('farmbuild.webmapping.examples', ['farmbuild.webmapping'])

    .run(function ($rootScope) {
        $rootScope.appVersion = farmbuild.examples.webmapping.version;
    })

    .controller('MapCtrl', function ($scope, $log, $location, webmapping, googleaddresssearch, googlemapslayer, openlayersmap) {

        var load = $location.search().load || false, gmap, view, map, ol;

        $scope.farmData = {};

        $scope.loadFarmData = function ($fileContent) {
            try {
                $scope.farmData = $fileContent;
                $scope.farmGeometry = {};
                var farmGeometry = webmapping.load(angular.fromJson($fileContent));
                if (!angular.isDefined(farmGeometry)) {
                    $scope.noResult = true;
                    return;
                }
                $scope.farmGeometry = farmGeometry;
                $scope.saveToSessionStorage('farmData', angular.toJson($scope.farmData));
                $scope.saveToSessionStorage('farmGeometry', angular.toJson($scope.farmGeometry));

                var farm = farmGeometry.farm,
                    paddocks = farmGeometry.paddocks;
                ol = openlayersmap.load(gmap, farm, paddocks);
                map = ol.map;
                view = ol.view;
                googleaddresssearch.init('locationautocomplete', 'EPSG:4326', 'EPSG:3857', view, map);
            } catch (e) {
                console.error('farmbuild.nutrientCalculator.examples > load: Your file should be in json format');
                $scope.noResult = true;
            }
        };

        $scope.exportFarmData = function (farmData) {
            var url = 'data:application/json;charset=utf8,' + encodeURIComponent(JSON.stringify(farmData, undefined, 2));
            window.open(url, '_blank');
            window.focus();
        };

        $scope.calculate = function() {
            $log.info('calculate...');

            nutrientCalculator.ga.trackCalculate('AgSmart');
        };

        $scope.saveToSessionStorage = function (key, value) {
            sessionStorage.setItem(key, value);
        };

        function findInSessionStorage() {
            return angular.fromJson(sessionStorage.getItem('farmData'));
        };

      gmap = googlemapslayer.init("gmap", "olmap");
      ol = openlayersmap.load(gmap);
      map = ol.map;
      view = ol.view;
      googleaddresssearch.init('locationautocomplete', 'EPSG:4326', 'EPSG:3857', view, map);

    });
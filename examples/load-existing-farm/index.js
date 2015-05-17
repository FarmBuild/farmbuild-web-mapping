angular.module('farmbuild.webmapping.examples', ['farmbuild.webmapping'])

    .run(function ($rootScope) {
        $rootScope.appVersion = farmbuild.examples.webmapping.version;
    })

    .controller('MapCtrl', function ($scope, $log, $location, webmapping, googleaddresssearch, googlemapslayer) {

        var load = $location.search().load || false;

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
                initOlMap(farm, paddocks, googlemapslayer.init("gmap", "olmap"));
                googleaddresssearch.init('locationautocomplete', 'EPSG:4326', 'EPSG:3857', view, map);
            } catch (e) {
                console.error('farmbuild.nutrientCalculator.examples > load: Your file should be in json format')
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

    })

    .directive('onReadFile', function ($parse) {
        return {
            restrict: 'A',
            scope: false,
            link: function (scope, element, attrs) {
                var fn = $parse(attrs.onReadFile);

                element.on('change', function (onChangeEvent) {
                    var reader = new FileReader();

                    reader.onload = function (onLoadEvent) {
                        scope.$apply(function () {
                            fn(scope, {$fileContent: onLoadEvent.target.result});
                        });
                    };

                    reader.readAsText((onChangeEvent.srcElement || onChangeEvent.target).files[0]);
                });
            }
        };
    });
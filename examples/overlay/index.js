angular.module('farmbuild.webmapping.examples', ['farmbuild.webmapping'])

	.run(function ($rootScope) {
		$rootScope.appVersion = farmbuild.examples.webmapping.version;
	})

	.controller('MapCtrl', function ($scope, $log, $location, webmapping, googleaddresssearch, googlemapslayer, openlayersmap) {

		var load = $location.search().load || false, gmap, ol;

		$scope.farmData = {};
		$scope.noResult = $scope.farmLoaded = false;

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
				ol = openlayersmap.load(farm, paddocks);
				openlayersmap.integrateGMap(gmap);
				$scope.farmLoaded = true;
			} catch (e) {
				$log.error('farmbuild.nutrientCalculator.examples > load: Your file should be in json format');
				$scope.noResult = true;
			}
		};

		$scope.exportFarmData = function (farmData) {
			var url = 'data:application/json;charset=utf8,' + encodeURIComponent(JSON.stringify(farmData, undefined, 2));
			window.open(url, '_blank');
			window.focus();
		};

		$scope.calculate = function () {
			$log.info('calculate...');

			nutrientCalculator.ga.trackCalculate('AgSmart');
		};

		$scope.saveToSessionStorage = function (key, value) {
			sessionStorage.setItem(key, value);
		};

		function findInSessionStorage() {
			return angular.fromJson(sessionStorage.getItem('farmData'));
		};

		(function _init() {
			gmap = googlemapslayer.init("gmap");
			ol = openlayersmap.init('olmap', 'layers');
			openlayersmap.integrateGMap(gmap);
			googleaddresssearch.init('locationautocomplete');
		})();

	});
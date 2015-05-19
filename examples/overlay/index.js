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

				$scope.farmData = angular.fromJson($fileContent);
				var geometry = webmapping.load($scope.farmData);

				if (!angular.isDefined(geometry)) {
					$scope.noResult = true;
					return;
				}

				$scope.saveToSessionStorage('farmData', angular.toJson($scope.farmData));
				ol = openlayersmap.load(geometry.farm, geometry.paddocks);
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

		$scope.apply = function () {
			$log.info('calculate...');

			//webmapping.ga.trackCalculate('AgSmart');
		};

		$scope.saveToSessionStorage = function (key, value) {
			sessionStorage.setItem(key, value);
		};

		function findInSessionStorage() {
			return angular.fromJson(sessionStorage.getItem('farmData'));
		};

		function init() {
			gmap = googlemapslayer.init("gmap");
			ol = openlayersmap.init('olmap', 'layers');
			openlayersmap.integrateGMap(gmap);
			googleaddresssearch.init('locationautocomplete');
			if(findInSessionStorage()){
				$scope.loadFarmData(findInSessionStorage())
			}
		};

		init();

	});
angular.module('farmbuild.webmapping.examples', ['farmbuild.webmapping'])

	.run(function ($rootScope) {
		$rootScope.appVersion = farmbuild.examples.webmapping.version;
	})

	.controller('MapCtrl',
  function ($scope, $log, $location, webmapping, googleaddresssearch, googlemapslayer, openLayers) {

		$scope.farmData = {};
		$scope.farmChanged = false;
		$scope.noResult = $scope.farmLoaded = false;

		$scope.$watch('farmData', function(old,newVal){
			if(!angular.equals(old,newVal)){
				$scope.farmChanged = true;
			}
		}, true);

    //webmapping.farmdata.findPaddock(id)

    //geoJsons.paddocks.push

		$scope.loadFarmData = function () {
        $scope.farmData = webmapping.find();

				var geoJsons = webmapping.toGeoJsons($scope.farmData);

				if (!angular.isDefined(geoJsons)) {
					$scope.noResult = true;
					return;
				}

        gmap = googlemapslayer.init("gmap");

        openLayers.init('olmap', 'layers');


        openLayers.load(geoJsons.farm, geoJsons.paddocks);

        window.setTimeout(function() {
          openLayers.integrateGMap(gmap);

        }, 1000)

        $scope.farmLoaded = true;

			//webmapping.ga.track('AgSmart');
		};

    $scope.loadFarmData();

		$scope.exportFarmData = function (farmData) {
			var url = 'data:application/json;charset=utf8,' + encodeURIComponent(JSON.stringify(farmData, undefined, 2));
			window.open(url, '_blank');
			window.focus();
		};

		$scope.apply = function () {
			$log.info('apply...');
			$scope.saveToSessionStorage('farmData', angular.toJson($scope.farmData));
			$scope.farmChanged = false;
		};

		$scope.cancel = function () {
			$log.info('cancel...');
			$scope.farmData = findInSessionStorage();
			$scope.farmChanged = false;
		};

//		$scope.defineFarm = function () {
//			$log.info('defineFarm...');
//			$scope.farmLoaded = true;
//			$scope.farmChanged = false;
//			$scope.saveToSessionStorage('farmData', {});
//		};

//		$scope.saveToSessionStorage = function (key, value) {
//			sessionStorage.setItem(key, value);
//		};

//		$scope.deleteFromSessionStorage = function (key, value) {
//			sessionStorage.clear();
//			$scope.farmData = {};
//			openLayers.clear();
//			$scope.farmChanged = true;
//		};
//
//		function findInSessionStorage() {
//			return angular.fromJson(sessionStorage.getItem('farmData'));
//		};

//		function init() {
//			gmap = googlemapslayer.init("gmap");
//
//			openLayers.init('olmap', 'layers');
//
//			openLayers.integrateGMap(gmap);
//
//			googleaddresssearch.init('locationautocomplete');
//
////			if(findInSessionStorage() && findInSessionStorage().name && findInSessionStorage().geometry){
////				$scope.loadFarmData(findInSessionStorage())
////			}
//		};
//
//		init();

	});
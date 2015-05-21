angular.module('farmbuild.webmapping.examples', ['farmbuild.webmapping'])

	.run(function ($rootScope) {
		$rootScope.appVersion = farmbuild.examples.webmapping.version;
	})

	.controller('MapCtrl', function ($scope, $log, $location, webmapping, googleaddresssearch, googlemapslayer, openLayers) {

		var load = $location.search().load || false, gmap;

		$scope.farmData = {};
		$scope.farmChanged = false;
		$scope.noResult = $scope.farmLoaded = false;

		$scope.$watch('farmData', function(old,newVal){
			if(!angular.equals(old,newVal)){
				$scope.farmChanged = true;
			}
		}, true);

		$scope.loadFarmData = function ($fileContent) {
			try {

				$scope.farmData = angular.fromJson($fileContent);
				var geometry = webmapping.load($scope.farmData).webMapping;

				if (!angular.isDefined(geometry)) {
					$scope.noResult = true;
					return;
				}

				openLayers.load(geometry.farm, geometry.paddocks);
				openLayers.integrateGMap(gmap);
				$scope.farmLoaded = true;

			} catch (e) {
				$log.error('farmbuild.nutrientCalculator.examples > load: Your file should be in json format');
				$scope.noResult = true;
			}

			//webmapping.ga.trackCalculate('AgSmart');
		};

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

		$scope.defineFarm = function () {
			$log.info('defineFarm...');
			$scope.farmLoaded = true;
			$scope.farmChanged = false;
			$scope.saveToSessionStorage('farmData', {});
		};

		$scope.saveToSessionStorage = function (key, value) {
			sessionStorage.setItem(key, value);
		};

		$scope.deleteFromSessionStorage = function (key, value) {
			sessionStorage.clear();
			$scope.farmData = {};
			openLayers.clear();
			$scope.farmChanged = true;
		};

		function findInSessionStorage() {
			return angular.fromJson(sessionStorage.getItem('farmData'));
		};

		function init() {
			//proj4.defs("EPSG:4283", "+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs");
			//var projection = ol.proj.get({code: 'EPSG:4283'});
			//var openLayerMap = new ol.Map({
			//	target: 'olmap',
			//	view:new ol.View({
			//		rotation: 0,
			//		projection: projection,
			//		maxZoom: 21
			//	}),
			//	interactions: ol.interaction.defaults({
			//		altShiftDragRotate: false,
			//		dragPan: false,
			//		rotate: false,
			//		mouseWheelZoom: true
			//	}).extend([new ol.interaction.DragPan({kinetic: null})]),
			//	controls: ol.control.defaults({
			//		attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
			//			collapsible: false
			//		})
			//	}).extend([
			//		new ol.control.ScaleLine()
			//	])
			//});
			gmap = googlemapslayer.init("gmap");
			openLayers.init('olmap', 'layers');
			openLayers.integrateGMap(gmap);
			googleaddresssearch.init('locationautocomplete');

//			if(findInSessionStorage() && findInSessionStorage().name && findInSessionStorage().geometry){
//				$scope.loadFarmData(findInSessionStorage())
//			}
		};

		init();

	});
angular.module('farmbuild.webmapping.examples', ['farmbuild.webmapping'])

	.run(function ($rootScope) {
		$rootScope.appVersion = farmbuild.examples.webmapping.version;
		$rootScope.decimalPrecision = farmbuild.examples.webmapping.decimalPrecision;
	})

	.controller('FarmCtrl', function ($scope, $log, webmapping) {

		$scope.farmData = {};

		$scope.createNew = function(farmNew) {
			$log.info('$scope.loadFarmData $fileContent..');
		}

		$scope.loadFarmData = function ($fileContent) {
			$log.info('$scope.loadFarmData $fileContent..');

			try {
				$scope.farmData = {};
				var farmData = webmapping.load(angular.fromJson($fileContent));

				if (!angular.isDefined(farmData)) {
					$scope.noResult = true;
					return;
				}

				//location.href = webmapping.farmdata.session.setLoadFlag(location);
				location.href = location.href + 'side/?load=true';

			} catch (e) {
				console.error('farmbuild.webmapping.examples > load: Your file should be in json format: ', e);
				$scope.noResult = true;
			}
		};

		$scope.exportFarmData = function (farmData) {
			var url = 'data:application/json;charset=utf8,' + encodeURIComponent(JSON.stringify(farmData, undefined, 2));
			window.open(url, '_blank');
			window.focus();
		};

		$scope.clear = function () {
			$scope.farmData ={};
			webmapping.farmdata.session.clear();
			var path = location.href.toString(),
				path = path.substring(0, path.indexOf('?'));
			location.href = path;
		}

		if (webmapping.session.isLoadFlagSet(location)) {
			var farmData = webmapping.find();

			updateFarmData($scope, farmData);
		}

		function updateFarmData($scope, farmData) {
			if(!farmData) {
				$log.error('Failed to load milkSold data...');
				$scope.noResult = true;
				return;
			}
			$scope.farmData = farmData;

		}

	})

	.directive('onReadFile', function ($parse, $log) {
		return {
			restrict: 'A',
			scope: false,
			link: function (scope, element, attrs) {
				var fn = $parse(attrs.onReadFile);

				element.on('change', function (onChangeEvent) {
					//var file =  (onChangeEvent.srcElement || onChangeEvent.target).files[0]
					var file =  (onChangeEvent.target).files[0]
					$log.info('onReadFile.onChange... onChangeEvent.srcElement:%s, ' +
						'onChangeEvent.target:%s, (onChangeEvent.srcElement || onChangeEvent.target).files[0]: %s',
						onChangeEvent.srcElement, onChangeEvent.target,
						angular.toJson(file))

					var reader = new FileReader();

					reader.onload = function (onLoadEvent) {
						//console.log('reader.onload', angular.toJson(onLoadEvent));
						scope.$apply(function () {
							fn(scope, {$fileContent: onLoadEvent.target.result});
						});
					};
					reader.onerror = function (onLoadEvent) {
						//console.log('reader.onload', angular.toJson(onLoadEvent));
					};

					reader.readAsText((onChangeEvent.srcElement || onChangeEvent.target).files[0]);
				});
			}
		};
	});
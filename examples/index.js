angular.module('farmbuild.webmapping.examples', ['farmbuild.webmapping'])

	.run(function ($rootScope) {
		$rootScope.appVersion = farmbuild.examples.webmapping.version;
		$rootScope.decimalPrecision = farmbuild.examples.webmapping.decimalPrecision;
	})

	.controller('FarmCtrl', function ($scope, $log, webmapping) {

		$scope.farmData = {},
    $scope.crsSupported = webmapping.farmdata.crsSupported,
    $scope.farmNew = {crs:$scope.crsSupported[0].name};

		$scope.createNew = function(farmNew) {
			$log.info('$scope.createNew %j', farmNew);
			/**
			 * You can construct the default values for paddock types and groups in your application and pass it to api on creation,
			 * your default values will override api default values.
			 * Defaults is optional and if omitted api default values will apply.
			 */
      var defaults = {
		      paddocks: {
			      groups: [{name: 'Business Default Group 1', paddocks: []}, {name: 'Business Default Group 2', paddocks: []}, {name: 'Business Default Group 2', paddocks: []}, {name: 'Business Default Group 2', paddocks: []}],
			      types: [{name: 'Business Default Type 1'}]
		      }
	      },
	      created = webmapping.create(farmNew.name, farmNew.id, farmNew.crs, defaults);

      if(!created) {
        $scope.noResult = true;
        return;
      }
      webmapping.load(created);
      directToSide();
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

				directToSide();
			} catch (e) {
				console.error('farmbuild.webmapping.examples > load: Your file should be in json format: ', e);
				$scope.noResult = true;
			}
		};
    function directToSide() {
      location.href = 'map/index.html?load=true';
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
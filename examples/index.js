'use strict';

/**
 * AngularJS is popular JavaScript MVC framework which is developed by google.
 * In this example we use AngularJS to construct the structure of the client side application.
 * You can find out more about AngularJS at https://angularjs.org
 * In farmbuild project we have used AngularJS as an internal dependency to provide modular structure, but to use FarmBuild JavaScript libraries you are forced to use AngularJS.
 * All the api function are available via "farmbuild" namespace (eg: farmbuild.webmapping, farmbuild.nutrientcalculator).
 * If you are using AngularJS in your application you can consume farmbuild component as AngularJS modules, similar to this example.
 */

/**
 * Defining my application and passing 'farmbuild.webmapping' as a dependency to be injected.
 */
angular.module('farmbuild.webmapping.examples', ['farmbuild.webmapping'])

	/**
	 * "run" method is executed before any other function in application, so I am putting my initial configs here.
	 */
	.run(function ($rootScope) {
		/**
	  * Optional version number for sake of this example (not part of the webmapping api)
		*/
		$rootScope.appVersion = farmbuild.examples.webmapping.version;

		/**
		 * normalising the way we round numbers, this variable is used in html template
		 */
		$rootScope.decimalPrecision = farmbuild.examples.webmapping.decimalPrecision;
	})

	.controller('FarmCtrl', function ($scope, $log, webmapping) {

		$scope.farmData = {},
			/**
			 * Array of farmdata's supported crs
			 * Get first item in the Array
			*/
			$scope.crsSupported = webmapping.farmdata.crsSupported,
			$scope.farmNew = {crs: $scope.crsSupported[0].name};

		$scope.createNew = function (farmNew) {
			$log.info('$scope.createNew %j', farmNew);
			/**
			 * You can construct the default values for paddock types and groups in your application and pass it to api on creation,
			 * your default values will override api default values. (eg: [{name: 'Business Default Type 1'}])
			 * Defaults is optional and if omitted api default values will apply.
			 * If you like to extend api default values you can get api ones and add your own values (eg: webmapping.paddocks.types.toArray())
			 */
			var myPaddockGroups = [
					{name: 'Business Default Group 1', paddocks: []},
					{name: 'Business Default Group 2', paddocks: []}
				],
				apiPaddockTypes = webmapping.paddocks.types.toArray(),
				myPaddockTypes = [{name: 'Business Default Type 1'}],
				myOptions = {
					paddockGroups: myPaddockGroups,
					/**
					 * Example of type containing api paddock types and custom types, concat is a JavaScript method to concat two Arrays.
					 * You may use any other library or function to concat these arrays.
					 */
					paddockTypes: apiPaddockTypes.concat(myPaddockTypes)
				},

				/**
				 * Create farmdata with this configurations, ,look at the api docs for more description.
				 */
				created = webmapping.create(farmNew.name, farmNew.id, farmNew.crs, myOptions);

			if (!created) {
				$scope.noResult = true;
				return;
			}

			/**
			 * Loading farmdata into session storage, webmapping utilises browser session storage to persist data while you change things.
			 * Later you can use export function to download the updated farmdata as a json file.
			 */
			webmapping.load(created);
			directToSide();
		}


		/**
		 * Load farmdata if you already have valid one.
		 * This function is called using the onReadFile directive.
		 */
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

		/**
		 * redirect to the webmapping page
		 */
		function directToSide() {
			location.href = 'map/index.html?load=true';
		}

		/**
		 * utility method to detect whether to force load or not
		 */
		if (webmapping.session.isLoadFlagSet(location)) {
			var farmData = webmapping.find();

			updateFarmData($scope, farmData);
		}

		/**
		 * update farmdata on controller $scope
		 */
		function updateFarmData($scope, farmData) {
			if (!farmData) {
				$log.error('Failed to load milkSold data...');
				$scope.noResult = true;
				return;
			}
			$scope.farmData = farmData;

		}

	})

	/**
	 * directives are markers on a DOM element (such as an attribute,
	 * element name, comment or CSS class) that tell AngularJS's HTML compiler ($compile) to attach a specified behavior to that DOM element (e.g. via event listeners),
	 * or even to transform the DOM element and its children
	 * visit https://docs.angularjs.org/guide/directive for more information
	*/
	.directive('onReadFile', function ($parse, $log) {
		return {
			restrict: 'A',
			scope: false,
			link: function (scope, element, attrs) {
				var fn = $parse(attrs.onReadFile);

				element.on('change', function (onChangeEvent) {
					//var file =  (onChangeEvent.srcElement || onChangeEvent.target).files[0]
					var file = (onChangeEvent.target).files[0]
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
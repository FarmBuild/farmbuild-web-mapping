'use strict';

/**
 * AngularJS is popular JavaScript MVC framework which is developed by google.
 * In this example we use AngularJS to construct the structure of the client side application.
 * You can find out more about AngularJS at https://angularjs.org
 * In farmbuild project we have used AngularJS as an internal dependency to provide modular structure, but to use FarmBuild JavaScript libraries you are forced to use AngularJS.
 * All the api function are available via "farmbuild" namespace (eg: farmbuild.webmapping, farmbuild.nutrientcalculator)
 * If you are using AngularJS in your application you can consume farmbuild component as AngularJS modules, similar to this example.
 */
angular.module('farmbuild.webmapping.examples', ['farmbuild.webmapping'])

	.run(function ($rootScope) {
		/**
		 * Optional version number for sake of this example (not part of the webmapping api)
		 */
		$rootScope.appVersion = farmbuild.examples.webmapping.version;
	})

	.controller('MapCtrl',
	function ($scope, $log, $location, $rootScope, $filter, webmapping) {

		var dataProjection,

			/**  This example is using Web Mercator: EPSG:3857 to display data on google map */
			featureProjection = 'EPSG:3857',

			/**
			 * This is passed to ol.Map on creation to adjust maximum zoom level
			 */
			maxZoom = 19,

			/**
			 * In order to create google map we need to pass the container element in DOM
			 */
			googleMapElement = document.getElementById('gmap'),
			googleMap,
			olMap,

			/**
			 * putting different webmapping namespaces in local variables for easier access
			 */
			actions = webmapping.actions,
			measurement = webmapping.measurement,
			parcels = webmapping.parcels,
			olHelper = webmapping.olHelper,
			paddocks = webmapping.paddocks;

		$scope.measuredValue = 0;
		$scope.farmData = {};
		$scope.farmChanged = false;
		$scope.paddockChanged = false;
		$scope.noResult = $scope.farmLoaded = false;
		$scope.selectedLayer = '';
		$scope.selectedPaddock = {
			name: '',
			type: '',
			comment: '',
			group: ''
		};
		$scope.donutDrawing = false;

		function loadParcels() {
			var parcelsServiceUrl = 'https://farmbuild-wfs.agriculture.vic.gov.au/geoserver/farmbuild/wfs',
				parcelsExtent, extentProjection, responseProjection;

			/**
			 * in this example we use the same projection for extent data and response,
			 * but they can be different based on your application setting.
			 */
			extentProjection = responseProjection = featureProjection;

			if ($scope.selectedLayer === '' || olMap.getView().getZoom() < 14) {
				return;
			}
			parcelsExtent = olMap.getView().calculateExtent(olMap.getSize());
			parcels.load(parcelsServiceUrl, parcelsExtent, extentProjection, responseProjection);
		}

		/**  Create google map object, customise the map object as you like. */
		function createGoogleMap(type) {
			return new google.maps.Map(googleMapElement, {
				disableDefaultUI: true,
				keyboardShortcuts: false,
				draggable: false,
				disableDoubleClickZoom: true,
				scrollwheel: false,
				streetViewControl: false,
				mapTypeId: type
			})
		}

		/** Create openlayers map object, customise the map object as you like. */
		function createOpenLayerMap(geoJsons) {

			/** it is recommended to use these helper functions to create your farm and paddocks layers
			 If you are using olHelper.createBaseLayers(), use olHelper.init() to initialise webmapping
			 If you are using olHelper.createBaseLayersWithGoogleMaps(), use olHelper.initWithGoogleMap() to initialise webmapping
			 */
			var farmLayers = olHelper.createFarmLayers(geoJsons, dataProjection),
			//baseLayers = olHelper.createBaseLayers();
				baseLayers = olHelper.createBaseLayersWithGoogleMaps();

			return new ol.Map({
				layers: [baseLayers, farmLayers],
				target: 'olmap',
				keyboardEventTarget: googleMapElement,
				view: new ol.View({
					rotation: 0,
					maxZoom: maxZoom
				}),
				interactions: ol.interaction.defaults({
					altShiftDragRotate: false,
					dragPan: false,
					rotate: false,
					mouseWheelZoom: true
				}).extend([new ol.interaction.DragPan()])
			})
		}

		/**
		 * This is how I am deciding to enable drawing or editing.
		 * If mouse cursor is on top of the one of existing polygons and user does a single click it means edit.
		 * If mouse cursor is not top of any of existing polygons and user does a single click it means drawing a new polygon.
		 * This is a exhaustive way to handle map events,
		 * but it make your application smarter in the way it would understand user's intention.
		 * If your application is targeting touch devices like tablet or smart phones, you may use other logic and events that fits you need.
		 */
		function mapOnPointerMove(event) {

			/** avoid to do anything if user is dragging */
			if (event.dragging) {
				return;
			}

			var selectedLayer = $scope.selectedLayer, coordinate = event.coordinate,
				featureAtCoordinate;
			if (selectedLayer === "paddocks") {
				selectedLayer = olHelper.paddocksLayer(olMap);
			}
			if (selectedLayer === "farm") {
				selectedLayer = olHelper.farmLayer(olMap);
			}
			featureAtCoordinate = webmapping.paddocks.findByCoordinate(coordinate, selectedLayer);
			if (featureAtCoordinate && !actions.drawing.isDrawing()) {
				actions.editing.enable();
			}
			if (!featureAtCoordinate && !actions.editing.isEditing()) {
				actions.drawing.enable();
			}
		}

		/**
		 * I need to update angular $scope to update data binding,
		 * Since some of the updates are happening out of angular worlds, I need to notify the angular manually.
		 */
		function updateNgScope() {
			if (!$scope.$$phase) {
				$scope.$apply();
			}
		}

		function paddockChanged() {
			$scope.paddockChanged = true;
			updateNgScope();
		}

		$scope.onPaddockDetailsChanged = function () {
			var sp = $scope.selectedPaddock;
			actions.features.selections().item(0).setProperties({
				type: sp.type,
				name: sp.name,
				comment: sp.comment,
				area: sp.area,
				group: sp.group
			});
			paddockChanged();
		};

		function farmChanged() {
			$scope.farmChanged = true;
			updateNgScope();
		}

		$scope.onFarmNameChanged = function () {
			if($scope.selectedLayer !== 'farm'){
				$scope.noResult = 'Select farm from edit layers drop down, to edit farm details!';
				return;
			}
			olHelper.farmLayer(olMap).getSource().getFeatures()[0].setProperties({
				name: $scope.farmData.name
			});
			farmChanged();
		};

		function onPaddockSelect(event, selectedPaddock) {
			if ($scope.paddockChanged) {
				$scope.cancel();
			}
			$scope.selectedPaddock = selectedPaddock.getProperties();

			if($scope.selectedPaddock.group) {
				$scope.selectedPaddock.group = function () {
					var result;
					angular.forEach($scope.paddockGroups, function (group) {
						if (group.name === $scope.selectedPaddock.group.name) {
							result = group;
						}
					});
					return result;
				}();
			}

			if($scope.selectedPaddock.type) {
				$scope.selectedPaddock.type = function () {
					var result;
					angular.forEach($scope.paddockTypes, function (group) {
						if (group.name === $scope.selectedPaddock.type.name) {
							result = group;
						}
					});
					return result;
				}();
			}

			$scope.selectedPaddock.area = measurement.area(selectedPaddock);
			$log.info('Paddock selected: ' + $scope.selectedPaddock.name);
			updateNgScope();
		};

		function onPaddockDeselect(event) {
			$scope.selectedPaddock = {};
			updateNgScope();
		};

		$scope.selectLayer = function () {
			var activateSnapping = true,
				activateKeyboardInteractions = true,
				farmLayerGroup = olHelper.farmLayerGroup(olMap),
				farmLayer = olHelper.farmLayer(olMap),
				paddocksLayer = olHelper.paddocksLayer(olMap),
				selectedLayer = $scope.selectedLayer;
			if (angular.isDefined(actions.snapping.active())) {
				activateSnapping = actions.snapping.active();
			}
			$scope.cancel();
			actions.destroy(olMap);
			$scope.selectedPaddock = {};
			if ($scope.selectedLayer === '') {
				olMap.un('pointermove', mapOnPointerMove);
				return;
			}
			actions.init(olMap, farmLayerGroup, selectedLayer, activateSnapping, activateKeyboardInteractions);
			olMap.on('pointermove', mapOnPointerMove);
			farmLayer.getSource().on('changefeature', farmChanged);
			paddocksLayer.getSource().on('changefeature', paddockChanged);
			loadParcels();
		};

		function clipSelectedFeature() {
			$log.info('Clipping selected paddock...');
			var selectedPaddock = actions.features.selections().item(0);
			actions.features.clip(selectedPaddock, olHelper.farmLayerGroup(olMap));
		};

		$scope.exportFarmData = function (farmData) {
			var paddocksGeometry = olHelper.exportGeometry(olHelper.paddocksLayer(olMap).getSource(), dataProjection),
				farmGeometry = olHelper.exportGeometry(olHelper.farmLayer(olMap).getSource(), dataProjection);
			webmapping.export(document, farmData, {paddocks: paddocksGeometry, farm: farmGeometry});
		};

		$scope.clear = function () {
			$scope.farmData = {};
			webmapping.session.clear();
			location.href = '../index.html'
		};


		/**
		 * Each time we do a change in webmapping like changing values of a paddock(name, type, group) or farm it self,
		 * defining new paddock or updating farm or paddock boundaries we need to apply changes on farmdata by calling save method.
		 * Then we reload the latest farmdata into webmapping to update its reference in webmapping.
		 * This whole workflow is done by apply function which makes sense in case of this example.
		 * You may separate these tasks and use different events or triggers to do it.
		*/
		$scope.apply = function () {
			$log.info('apply changes to farm data ...');

			/**
			 * If we are in the middle of drawing try to finish it.
			*/
			if (actions.drawing.isDrawing()) {
				/**
				 * If you are in the middle of drawing a polygon,
				 * tries finish drawing and if it is not possible just removes it.
				 */
				actions.drawing.finish();
			} else {
				clipSelectedFeature();
			}

			/**
			 * Get farm and paddocks source from webmapping
			 */
			var farmSource = olHelper.farmLayer(olMap).getSource(),
				paddocksSource = olHelper.paddocksLayer(olMap).getSource(),

				/**
				 * Convert geometries into farmdata compatible format to be saved
				 */
				paddocksGeometry = olHelper.exportGeometry(paddocksSource, dataProjection),
				farmGeometry = olHelper.exportGeometry(farmSource, dataProjection);

			/**
			 * It is invalid to have a farmdata without farm boundaries,
			 * here we are checking to raise an error if there is no farm boundary information.
			 */
			if (farmGeometry.features.length === 0) {
				$scope.noResult = 'Farm boundary is invalid, farm boundary should contain all paddocks';
				return;
			}

			/**
			 * It is invalid to have a farmdata without farm boundaries,
			 * here we are checking to raise an error if there is no farm boundary information.
			 */
			webmapping.save({paddocks: paddocksGeometry, farm: farmGeometry});

			/**
			 * Get recent saved farmdata from session, and update $scope.farmdata reference.
			 */
			$scope.farmData = webmapping.find();

			/**
			 * Update zoom to extent control's extent
			 */
			olHelper.updateExtent(olMap);

			/**
			 * Convert new farmdata to GeoJson format to pass to webmapping
			 */
			var geoJsons = webmapping.toGeoJsons($scope.farmData);
			if (!angular.isDefined(geoJsons)) {
				$scope.noResult = 'Farm data is invalid';
				return;
			}

			/**
			 * Reload the map with new data
			 */
			olHelper.reload(olMap, geoJsons, dataProjection);

			$scope.farmChanged = false;
			$scope.paddockChanged = false;
			$scope.selectedPaddock = {};
		};

		$scope.removeSelectedPaddock = function () {
			$log.info('removing selected paddock(s)...');
			var selectedPaddocks = actions.features.selections();
			actions.features.remove(selectedPaddocks);
			$scope.paddockChanged = false;
			$scope.selectedPaddock = {};
			farmChanged();
		};

		$scope.removeFarm = function () {
			$log.info('removing farm...');
			var farmFeature = olHelper.farmLayer(olMap).getSource().getFeatures();
			actions.features.remove(farmFeature);
			farmChanged();
		};

		$scope.cancel = function () {
			$log.info('cancel...');
			$scope.farmData = webmapping.find();
			var geoJsons = webmapping.toGeoJsons($scope.farmData);
			if (!angular.isDefined(geoJsons)) {
				$scope.noResult = 'Farm data is invalid';
				return;
			}
			olHelper.reload(olMap, geoJsons, dataProjection);
			if (actions.features.selections()) {
				actions.features.selections().clear();
			}
			$scope.farmChanged = false;
			$scope.paddockChanged = false;
		};

		$scope.enableDonutDrawing = function () {
			actions.donut.enable();
			olMap.un('pointermove', mapOnPointerMove);
			$scope.donutDrawing = true;
		};

		$scope.disableDonutDrawing = function () {
			olMap.on('pointermove', mapOnPointerMove);
			$scope.donutDrawing = false;
			paddockChanged();
		};


		/**
		 * webmapping.events provides list of events you can register for to understand certainn event in webmapping
		*/
		webmapping.on('web-mapping-draw-end', function (feature) {
			$scope.farmChanged = true;
			farmChanged();
		});

		webmapping.on('web-mapping-donut-draw-end', function () {
			$scope.disableDonutDrawing();
		});

		webmapping.on('web-mapping-measure-end', function (event, data) {
			$scope.measuredValue = data.value;
			$scope.measuredUnit = data.unit;
			updateNgScope();
		});

		webmapping.on('web-mapping-base-layer-change', function (event, data) {
			if (data.layer.getProperties().title === 'Google Street') {
				googleMapElement.firstChild.firstChild.style.display = 'block';
				googleMap.setMapTypeId(google.maps.MapTypeId.ROADMAP);
				return;
			}
			if (data.layer.getProperties().title === 'Google Imagery') {
				googleMapElement.firstChild.firstChild.style.display = 'block';
				googleMap.setMapTypeId(google.maps.MapTypeId.SATELLITE);
				return;
			}
			if (data.layer.getProperties().title.indexOf('VicMAP') > -1) {
				googleMapElement.firstChild.firstChild.style.display = 'none';
				return;
			}
		});

		webmapping.on('web-mapping-feature-select', function (event, data) {
			var selectedLayer = $scope.selectedLayer;
			if (selectedLayer === 'paddocks') {
				onPaddockSelect(event, data)
			}
		});

		webmapping.on('web-mapping-feature-deselect', function (event, data) {
			var selectedLayer = $scope.selectedLayer;
			if (selectedLayer === 'paddocks') {
				onPaddockDeselect(event, data)
			}
		});

		$scope.toGeoJson = function () {
			farmbuild.webmapping.exportGeoJson(document, $scope.farmData);
		};

		$scope.toKml = function () {
			farmbuild.webmapping.exportKml(document, $scope.farmData);
		};

		/**
		* If you want to use api to add custom paddock types this the way to to so
		*/
		function addCustomPaddockTypes(farmData){
			var name = 'New Custom Type using api';

			/**
			 * if there is type with the same name in farmdata, you would receive an error message
			 * You can check existence of a type by its unique name, using "webmapping.paddocks.types.byName" method
			 * add the types using paddock api and update
			 * unless you do an update the new type data would not be persisted on farmdata
			 * "update" is a farmdata method exposed through webmapping api.
			 * The main difference between save and update is that using update you are only updating farmdata component, so you do not need to pass geometries.
			*/
			if(!webmapping.paddocks.types.byName(name)) {
				webmapping.paddocks.types.add(name);
				webmapping.update(farmData);
			}
		}

		/**
		 * If you want to use api to add custom paddock groups this the way to to so
		 */
		function addCustomPaddockGroups(farmData){
			var name = 'New Custom Group using api';

			/**
			 * if there is group with the same name in farmdata, you would receive an error message
			 * You can check existence of a group by its unique name, using "webmapping.paddocks.types.byName" method
			 * add the groups using paddock api and update
			 * unless you do an update the new group data would not be persisted on farmdata
			 * "update" is a farmdata method exposed through webmapping api.
			 * The main difference between save and update is that using update you are only updating farmdata component, so you do not need to pass geometries.
			 */
			if(!webmapping.paddocks.groups.byName(name)) {
				webmapping.paddocks.groups.add(name);
				webmapping.update(farmData);
			}
		}

		$scope.loadFarmData = function () {
			var geoJsons;

			$scope.farmData = webmapping.find();
			addCustomPaddockTypes($scope.farmData);
			addCustomPaddockGroups($scope.farmData);
			$scope.paddockTypes = webmapping.paddocks.types.toArray();
			$scope.paddockGroups = webmapping.paddocks.groups.toArray();

			/** Convert geometry data of farmData to valid geoJson */
			geoJsons = webmapping.toGeoJsons($scope.farmData);

			if (!angular.isDefined(geoJsons)) {
				$scope.noResult = 'Farm data is invalid';
				return;
			}

			dataProjection = $scope.farmData.geometry.crs;

			/** Create openlayers map object, customise the map object as you like. */
			olMap = createOpenLayerMap(geoJsons);
			var extent = olHelper.farmLayer(olMap).getSource().getExtent(),
				openlayersMapEl = olMap.getTargetElement();


			/**  Create google map object, customise the map object as you like. */
			googleMap = createGoogleMap(google.maps.MapTypeId.SATELLITE);

			/** Openlayers 3 does not support google maps as a tile layer,
			 so we need to keep openlayers map view and google maps in sync,
			 this helper function does the job for you.
			 If you want to init with google map, you need to use olHelper.createBaseLayersWithGoogleMaps()
			 If you want to init without google map, you need to use olHelper.createBaseLayers()
			 */
			olHelper.initWithGoogleMap(olMap, extent, googleMap, openlayersMapEl);
			//olHelper.init(olMap, extent);

			/** Enable address google search for your map */
			olHelper.initGoogleAddressSearch('locationAutoComplete', olMap);

			/** track api usage by sending statistic to google analytics, this help us to improve service based on usage */
			webmapping.ga.trackWebMapping('farmbuild-test-client');

			/** it is up to you when to load parcels, this example is using map view's change event to load parcels data. Parcels data is used for snapping */
			olMap.getView().on('change:resolution', loadParcels);
			olMap.getView().on('change:center', loadParcels);
			$scope.farmLoaded = true;
		};

		$scope.loadFarmData();

	});

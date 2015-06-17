'use strict';

angular.module('farmbuild.webmapping.examples', ['farmbuild.webmapping'])

	.run(function ($rootScope) {
		$rootScope.appVersion = farmbuild.examples.webmapping.version;
	})

	.controller('MapCtrl',
	function ($scope, $log, $location, $rootScope, $filter, webmapping) {

		var dataProjection,

			/**  This example is using Web Mercator: EPSG:3857 to display data on google map */
			featureProjection = 'EPSG:3857',

			maxZoom = 19,
			googleMapElement = document.getElementById('gmap'),
			googleMap,
			olMap,
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
		$scope.paddockTypes = paddocks.types();
		$scope.paddockGroups = paddocks.groups();

		function loadParcels() {
			var parcelsServiceUrl = 'https://farmbuild-wfs-stg.agriculture.vic.gov.au/geoserver/farmbuild/wfs',
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

			/** it is recommended to use these helper functions to create your farm and paddocks layers */
			var farmLayers = olHelper.createFarmLayers(geoJsons, dataProjection, featureProjection),
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

		function mapOnPointerMove(event) {

			/** don't do anything if user is dragging */
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

		function mapOnSigleClick(event) {

			/** don't do anything if user is dragging */
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
			if (featureAtCoordinate) {
				actions.editing.enable();
			}
			if (!featureAtCoordinate) {
				actions.drawing.enable();
			}
		}

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
			actions.features.selections().item(0).setProperties({
				name: $scope.farmData.name
			});
			farmChanged();
		};

		function onPaddockSelect(event, selectedPaddock) {
			if ($scope.paddockChanged) {
				$scope.cancel();
			}
			$scope.selectedPaddock = selectedPaddock.getProperties();
			$scope.selectedPaddock.area = measurement.area(selectedPaddock, dataProjection, featureProjection);
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
			if (ol.has.TOUCH) {
				olMap.on('singleclick', mapOnSigleClick);
			} else {
				olMap.on('pointermove', mapOnPointerMove);
			}
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
			var paddocksGeometry = olHelper.exportGeometry(olHelper.paddocksLayer(olMap).getSource(), dataProjection, featureProjection),
				farmGeometry = olHelper.exportGeometry(olHelper.farmLayer(olMap).getSource(), dataProjection, featureProjection);
			webmapping.export(document, farmData, {paddocks: paddocksGeometry, farm: farmGeometry});
		};

		$scope.clear = function () {
			$scope.farmData = {};
			webmapping.session.clear();
			location.href = '../index.html'
		};

		$scope.apply = function () {
			$log.info('apply changes to farm data ...');
			if (actions.drawing.isDrawing()) {
				actions.drawing.finish();
			} else {
				clipSelectedFeature();
			}
			var farmSource = olHelper.farmLayer(olMap).getSource(),
				paddocksSource = olHelper.paddocksLayer(olMap).getSource(),
				paddocksGeometry = olHelper.exportGeometry(paddocksSource, dataProjection, featureProjection),
				farmGeometry = olHelper.exportGeometry(farmSource, dataProjection, featureProjection);

			if (farmGeometry.features.length === 0 || !ol.extent.containsExtent(farmSource.getExtent(), paddocksSource.getExtent())) {
				$log.error('Draw farm boundary first!');
				$scope.noResult = true;
				return;
			}
			$scope.farmData = webmapping.save({paddocks: paddocksGeometry, farm: farmGeometry});
			olHelper.updateExtent(olMap);
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
				$scope.noResult = true;
				return;
			}
			olHelper.reload(olMap, geoJsons, dataProjection, featureProjection);
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

		$rootScope.$on('web-mapping-draw-end', function () {
			$scope.farmChanged = true;
			farmChanged();
		});

		$rootScope.$on('web-mapping-donut-draw-end', function () {
			$scope.disableDonutDrawing();
		});

		$rootScope.$on('web-mapping-measure-end', function (event, data) {
			$scope.measuredValue = data.value;
			$scope.measuredUnit = data.unit;
			updateNgScope();
		});

		$rootScope.$on('web-mapping-base-layer-change', function (event, data) {
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

		$rootScope.$on('web-mapping-feature-select', function (event, data) {
			var selectedLayer = $scope.selectedLayer;
			if (selectedLayer === 'paddocks') {
				onPaddockSelect(event, data)
			}
		});

		$rootScope.$on('web-mapping-feature-deselect', function (event, data) {
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

		$scope.loadFarmData = function () {
			var geoJsons;

			$scope.farmData = webmapping.find();

			/** Convert geometry data of farmData to valid geoJson */
			geoJsons = webmapping.toGeoJsons($scope.farmData);

			if (!angular.isDefined(geoJsons)) {
				$scope.noResult = true;
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
			 this helper function does the job for you. */
			olHelper.initWithGoogleMap(olMap, dataProjection, extent, googleMap, openlayersMapEl);
			//olHelper.init(olMap, dataProjection, extent);

			/** Enable address google search for your map */
			olHelper.initGoogleAddressSearch('locationAutoComplete', olMap);

			/** track api usage by sending statistic to google analytics, this help us to improve service based on usage */
			webmapping.ga.trackWebMapping('AgSmart');

			/** it is up to you when to load parcels, this example is using map view's change event to load parcels data. Parcels data is used for snapping */
			olMap.getView().on('change:resolution', loadParcels);
			olMap.getView().on('change:center', loadParcels);
			$scope.farmLoaded = true;
		};

		$scope.loadFarmData();

	});

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

			maxZoom = 18,
			layerSelectionElement = document.getElementById('layers'),
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

			if (layerSelectionElement.value === '' || olMap.getView().getZoom() < 14) {
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
			var farmLayers = olHelper.farmLayers(geoJsons, dataProjection, featureProjection),
				baseLayers = olHelper.baseLayers();

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

			var selectedLayer = layerSelectionElement.value, coordinate = event.coordinate,
				featureAtCoordinate;
			if (selectedLayer === "paddocks") {
				selectedLayer = olMap.getLayers().item(1).getLayers().item(0);
			}
			if (selectedLayer === "farm") {
				selectedLayer = olMap.getLayers().item(1).getLayers().item(1);
			}
			featureAtCoordinate = webmapping.paddocks.findByCoordinate(coordinate, selectedLayer);
			if (featureAtCoordinate && !actions.drawing.isDrawing()) {
				actions.editing.enable();
			}
			if (!featureAtCoordinate && !actions.editing.isEditing()) {
				actions.drawing.enable();
			}
		}

		function onPaddockChanged() {
			$scope.paddockChanged = true;
			if (!$scope.$$phase) {
				$scope.$apply();
			}
		}

		$scope.onPaddockDetailsChanged = function () {
			var sp = $scope.selectedPaddock;
			actions.features.selected().item(0).setProperties({
				type: sp.type,
				name: sp.name,
				comment: sp.comment,
				area: sp.area,
				group: sp.group
			});
			onPaddockChanged();
		};

		function onFarmChanged() {
			$scope.farmChanged = true;
			if (!$scope.$$phase) {
				$scope.$apply();
			}
		}

		$scope.onFarmNameChanged = function () {
			actions.features.selected().item(0).setProperties({
				name: $scope.farmData.name
			});
			onFarmChanged();
		};

		function onPaddockSelect(event, data) {
			var selectedPaddock = data.features.item(0);
			$scope.selectedPaddock = selectedPaddock.getProperties();
			$scope.selectedPaddock.area = measurement.area(selectedPaddock);
			$log.info('Paddock selected: ' + $scope.selectedPaddock.name);
			$scope.$apply();
		};

		function onPaddockDeselect(event, data) {
			$scope.selectedPaddock = {};
			if ($scope.paddockChanged) {
				$scope.cancel();
			}
			onPaddockChanged();
		};

		function selectLayer() {
			var selectedLayer = this.value;

			if (selectedLayer === '') {
				actions.destroy(olMap);
				olMap.un('pointermove', mapOnPointerMove);
				return;
			}

			actions.destroy(olMap);
			actions.init(olMap, olMap.getLayers().item(1).getLayers().item(1), olMap.getLayers().item(1).getLayers().item(0), selectedLayer);
			olMap.on('pointermove', mapOnPointerMove);
			olMap.getLayers().item(1).getLayers().item(0).getSource().on('changefeature', onPaddockChanged);
			olMap.getLayers().item(1).getLayers().item(1).getSource().on('changefeature', onFarmChanged);
			loadParcels();
		};

		function clipSelectedPaddock() {
			$log.info('Clipping selected paddock...');
			var selectedPaddock;
			if (actions.features.selected() && actions.features.selected().item(0) && layerSelectionElement.value === 'paddocks') {
				selectedPaddock = actions.features.selected().item(0);
				actions.features.clip(selectedPaddock, olMap.getLayers().item(1).getLayers().item(0).getSource(), olMap.getLayers().item(1).getLayers().item(1).getSource());
			}
		};

		$scope.exportFarmData = function (farmData) {
			var paddocksGeometry = olHelper.exportGeometry(olMap.getLayers().item(1).getLayers().item(0).getSource(), dataProjection, featureProjection);
			var farmGeometry = olHelper.exportGeometry(olMap.getLayers().item(1).getLayers().item(1).getSource(), dataProjection, featureProjection);
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
				clipSelectedPaddock();
			}
			var paddocksGeometry = olHelper.exportGeometry(olMap.getLayers().item(1).getLayers().item(0).getSource(), dataProjection, featureProjection);
			var farmGeometry = olHelper.exportGeometry(olMap.getLayers().item(1).getLayers().item(1).getSource(), dataProjection, featureProjection);

			if (farmGeometry.features.length === 0) {
				$log.error('Draw farm boundary first!');
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
			var selectedPaddocks = actions.features.selected();
			actions.features.remove(selectedPaddocks);
			$scope.paddockChanged = false;
			$scope.selectedPaddock = {};
			$scope.farmChanged = true;
		};

		$scope.removeFarm = function () {
			$log.info('removing farm...');
			var farmFeature = olMap.getLayers().item(1).getLayers().item(1).getSource().getFeatures();
			actions.features.remove(farmFeature);
			onFarmChanged();
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
			actions.features.selected().clear();
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
			onPaddockChanged();
		};

		$rootScope.$on('web-mapping-draw-end', function () {
			$scope.farmChanged = true;
		});

		$rootScope.$on('web-mapping-measure-end', function (event, data) {
			$scope.measuredValue = data.value;
			$scope.measuredUnit = data.unit;
			$scope.$apply();
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
			var selectedLayer = layerSelectionElement.value;
			if (selectedLayer === 'paddocks') {
				onPaddockSelect(event, data)
			}
		});

		$rootScope.$on('web-mapping-feature-deselect', function (event, data) {
			var selectedLayer = layerSelectionElement.value;
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
			var extent = olMap.getLayers().item(1).getLayers().item(1).getSource().getExtent();


			/**  Create google map object, customise the map object as you like. */
			googleMap = createGoogleMap(google.maps.MapTypeId.SATELLITE);

			/** Openlayers 3 does not support google maps as a tile layer,
			 so we need to keep openlayers map view and google maps in sync,
			 this helper function does the job for you. */
				//olHelper.integrateGoogleMap(gmap, olmap, dataProjection);
			olHelper.integrateGoogleMap(googleMap, olMap, dataProjection, document.getElementById('olmap'), true, extent);

			/** Enable address google search for your map */
			olHelper.initGoogleAddressSearch('locationAutoComplete', olMap);

			layerSelectionElement.addEventListener('change', selectLayer);

			actions.keyboardShortcuts.enable('gmap');

			/** track api usage by sending statistic to google analytics, this help us to improve service based on usage */
			webmapping.ga.trackWebMapping('AgSmart');

			/** it is up to you when to load parcels, this example is using map view's change event to load parcels data. Parcels data is used for snapping */
			olMap.getView().on('change:resolution', loadParcels);
			olMap.getView().on('change:center', loadParcels);
			$scope.farmLoaded = true;
		};

		$scope.loadFarmData();

	});

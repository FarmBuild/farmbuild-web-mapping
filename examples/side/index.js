angular.module('farmbuild.webmapping.examples', ['farmbuild.webmapping'])

	.run(function ($rootScope) {
		$rootScope.appVersion = farmbuild.examples.webmapping.version;
	})

	.controller('MapCtrl',
	function ($scope, $log, $location, $rootScope, webmapping) {

		var dataProjection,

			/**  This example is using Web Mercator: EPSG:3857 to display data on google map */
			featureProjection = 'EPSG:3857',

			maxZoom = 21,
			layerSelectionElement = document.getElementById('layers'),
			gmapElement = document.getElementById('gmap'),
			gmap,
			olmap,
			actions = webmapping.actions,
			measurement = webmapping.measurement,
			parcels = webmapping.parcels,
			olHelper = webmapping.olHelper;
		$scope.measuredValue = 0;

		$scope.farmData = {};
		$scope.farmChanged = false;
		$scope.paddockChanged = false;
		$scope.noResult = $scope.farmLoaded = false;
		$scope.farmData.selectedPaddockName = '';
		$scope.donutDrawing = false;
		$scope.farmSelected = false;

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
			olmap = createOpenLayerMap(geoJsons);

			/**  Create google map object, customise the map object as you like. */
			gmap = createGoogleMap();

			/** Openlayers 3 does not support google maps as a tile layer,
			 so we need to keep openlayers map view and google maps in sync,
			 this helper function does the job for you. */
			olHelper.integrateGMap(gmap, olmap, dataProjection);

			/** Enable address google search for your map */
			olHelper.initAddressSearch('locationAutoComplete', olmap);

			layerSelectionElement.addEventListener('change', selectLayer);

			actions.keyboardShortcuts.enable('gmap');

			/** track api usage by sending statistic to google analytics, this help us to improve service based on usage */
			webmapping.ga.trackWebMapping('AgSmart');

			/** it is up to you when to load parcels, this example is using map view's change event to load parcels data. Parcels data is used for snapping */
			olmap.getView().on('change:resolution', loadParcels);
			olmap.getView().on('change:center', loadParcels);

			$scope.farmLoaded = true;
		};

		function loadParcels() {
			var parcelsServiceUrl = 'https://farmbuild-wfs-stg.agriculture.vic.gov.au/geoserver/farmbuild/wfs',
				parcelsExtent, extentProjection, responseProjection;

			/**
			 * in this example we use the same projection for extent data and response,
			 * but they can be different based on your application setting.
			 */
			extentProjection = responseProjection = featureProjection;

			if (layerSelectionElement.value === '' || layerSelectionElement.value === 'none') {
				return;
			}
			parcelsExtent = olmap.getView().calculateExtent(olmap.getSize());
			parcels.load(parcelsServiceUrl, parcelsExtent, extentProjection, responseProjection);
		}

		/**  Create google map object, customise the map object as you like. */
		function createGoogleMap() {
			return new google.maps.Map(gmapElement, {
				disableDefaultUI: true,
				keyboardShortcuts: false,
				draggable: false,
				disableDoubleClickZoom: true,
				scrollwheel: false,
				streetViewControl: false,
				mapTypeId: google.maps.MapTypeId.SATELLITE
			})
		}

		/** Create openlayers map object, customise the map object as you like. */
		function createOpenLayerMap(geoJsons) {

			/** it is recommended to use these helper functions to create your farm and paddocks layers */
			var farmLayer = olHelper.farmLayer(geoJsons.farm, dataProjection, featureProjection),
				paddocksLayer = olHelper.paddocksLayer(geoJsons.paddocks, dataProjection, featureProjection);

			return new ol.Map({
				layers: [paddocksLayer, farmLayer],
				target: 'olmap',
				keyboardEventTarget: gmapElement,
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
				selectedLayer = olmap.getLayers().item(0);
			}
			if (selectedLayer === "farm") {
				selectedLayer = olmap.getLayers().item(1);
			}
			featureAtCoordinate = webmapping.paddocks.findByCoordinate(coordinate, selectedLayer);
			if (featureAtCoordinate && !actions.drawing.active()) {
				actions.editing.enable();
			}
			if (!featureAtCoordinate && !actions.editing.active()) {
				actions.drawing.enable();
			}
		}

		function mapOnDblClick(event) {
			var coordinate = event.coordinate,
				paddockAtCoordinate = webmapping.paddocks.findByCoordinate(coordinate, olmap.getLayers().item(0));
			if (paddockAtCoordinate && actions.editing.active()) {
				actions.donut.enable();
			}
		}

		function onPaddockChanged(e) {
			$scope.paddockChanged = true;
			if (!$scope.$$phase) {
				$scope.$apply();
			}
		}

		function onFarmChanged(e) {
			$scope.farmChanged = true;
			if (!$scope.$$phase) {
				$scope.$apply();
			}
		}

		function mapOnClick(event) {
			var coordinate = event.coordinate, selectedLayer = layerSelectionElement.value,
				paddockAtCoordinate = webmapping.paddocks.findByCoordinate(coordinate, olmap.getLayers().item(0));
			if ($scope.paddockChanged) {
				$scope.cancel();
			}
			if ((selectedLayer !== 'paddocks') || !paddockAtCoordinate) {
				$scope.farmData.selectedPaddockName = '';
				$scope.$apply();
				return;
			}
			$scope.farmData.selectedPaddockName = paddockAtCoordinate.getProperties().name;
			$scope.farmData.selectedPaddockArea = measurement.area(paddockAtCoordinate);
			$log.info('Paddock selected: ' + $scope.farmData.selectedPaddockName);
			$scope.$apply();
		}

		function selectLayer() {
			var selectedLayer = this.value;
			$scope.farmSelected = false;

			if (selectedLayer === 'none' || selectedLayer === '') {
				actions.destroy(olmap);
				olmap.un('pointermove', mapOnPointerMove);
				olmap.un('dblclick', mapOnDblClick);
				olmap.un('click', mapOnClick);
				return;
			}

			if (selectedLayer === 'farm') {
				$scope.farmSelected = true;
				$scope.$apply();
			}

			actions.destroy(olmap);
			actions.init(olmap, olmap.getLayers().item(1), olmap.getLayers().item(0), selectedLayer);
			olmap.on('pointermove', mapOnPointerMove);
			olmap.on('dblclick', mapOnDblClick);
			olmap.on('click', mapOnClick);
			olmap.getLayers().item(0).getSource().on('changefeature', onPaddockChanged);
			olmap.getLayers().item(1).getSource().on('changefeature', onFarmChanged);
			loadParcels();
		}

		function clipSelectedPaddock() {
			$log.info('Clipping selected paddock...');
			var selectedPaddock;
			if (actions.features.selected() && actions.features.selected().item(0) && layerSelectionElement.value === 'paddocks') {
				selectedPaddock = actions.features.selected().item(0);
				actions.features.clip(selectedPaddock, olmap.getLayers().item(0).getSource(), olmap.getLayers().item(1).getSource());
			}
		};

		$scope.loadFarmData();

		$scope.exportFarmData = function (farmData) {
			var paddocksGeometry = olHelper.exportGeometry(olmap.getLayers().item(0).getSource(), dataProjection, featureProjection);
			var farmGeometry = olHelper.exportGeometry(olmap.getLayers().item(1).getSource(), dataProjection, featureProjection);

			webmapping.export(document, farmData, {paddocks: paddocksGeometry, farm: farmGeometry});
		};

		$scope.clear = function () {
			$scope.farmData = {};
			webmapping.session.clear();
			location.href = '../index.html'
		}

		$scope.apply = function () {
			$log.info('apply changes to farm data ...');
			if (actions.drawing.active()) {
				actions.drawing.finish();
			} else {
				clipSelectedPaddock();
			}
			var paddocksGeometry = olHelper.exportGeometry(olmap.getLayers().item(0).getSource(), dataProjection, featureProjection);
			var farmGeometry = olHelper.exportGeometry(olmap.getLayers().item(1).getSource(), dataProjection, featureProjection);

			if (farmGeometry.features.length === 0) {
				$log.error('Draw farm boundary first!');
				return;
			}

			$scope.farmData = webmapping.save({paddocks: paddocksGeometry, farm: farmGeometry});
			$scope.farmChanged = false;
			$scope.paddockChanged = false;
		};

		$scope.removeSelectedPaddock = function () {
			$log.info('removing selected paddock(s)...');
			var selectedPaddocks = actions.features.selected();
			actions.remove(selectedPaddocks);
			$scope.paddockChanged = false;
			$scope.farmData.selectedPaddockName = '';
			onFarmChanged();
		};

		$scope.removeFarm = function () {
			$log.info('removing farm...');
			var farmFeature = olmap.getLayers().item(1).getSource().getFeatures();
			actions.remove(farmFeature);
			$scope.farmSelected = false;
			onFarmChanged();
		};

		$scope.cancel = function () {
			$log.info('cancel...');
			var selectedLayer = layerSelectionElement.value;
			$scope.farmData = webmapping.find();
			var geoJsons = webmapping.toGeoJsons($scope.farmData);
			if (!angular.isDefined(geoJsons)) {
				$scope.noResult = true;
				return;
			}
			actions.destroy(olmap);
			olmap.un('pointermove', mapOnPointerMove);
			olmap.un('dblclick', mapOnDblClick);
			olmap.un('click', mapOnClick);

			olHelper.reload(olmap, geoJsons, dataProjection, featureProjection);

			actions.init(olmap, olmap.getLayers().item(1), olmap.getLayers().item(0), selectedLayer);
			olmap.on('pointermove', mapOnPointerMove);
			olmap.on('dblclick', mapOnDblClick);
			olmap.on('click', mapOnClick);
			olmap.getLayers().item(0).getSource().on('changefeature', onPaddockChanged);
			olmap.getLayers().item(1).getSource().on('changefeature', onFarmChanged);

			$scope.farmChanged = false;
			$scope.paddockChanged = false;
			if (selectedLayer === 'farm') {
				$scope.farmSelected = true;
			}
		};

		$scope.onFarmNameChanged = function () {
			olmap.getLayers().item(1).getSource().getFeatures()[0].setProperties({
				name: $scope.farmData.name
			});
			onFarmChanged();
		};

		$scope.onPaddockNameChanged = function () {
			actions.features.selected().item(0).setProperties({
				name: $scope.farmData.selectedPaddockName
			});
			onPaddockChanged();
		};

		$scope.enableDonutDrawing = function () {
			actions.donut.enable();
			olmap.un('pointermove', mapOnPointerMove);
			$scope.donutDrawing = true;
		};

		$scope.disableDonutDrawing = function () {
			olmap.on('pointermove', mapOnPointerMove);
			$scope.donutDrawing = false;
			onPaddockChanged();
		};

		$rootScope.$on('mapdrawend', function () {
			$scope.farmChanged = true;
		});

		$rootScope.$on('web-mapping-measure-end', function (event, data) {
			$scope.measuredValue = data.value;
			$scope.measuredUnit = data.unit;
			$scope.$apply();
		});

	});

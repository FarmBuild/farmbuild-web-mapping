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
			olHelper.integrateAddressSearch('locationAutoComplete', olmap);

			layerSelectionElement.addEventListener('change', selectLayer);

			gmapElement.addEventListener('keydown', keyboardActions);

			/** track api usage by sending statistic to google analytics, this help us to improve service based on usage */
			webmapping.ga.trackWebMapping('AgSmart');

			/** it is up to you when to load parcels, this example is using map view's change event to load parcels data. Parcels data is used for snapping */
			olmap.getView().on('change:resolution', loadParcels);
			olmap.getView().on('change:center', loadParcels);

			$scope.farmLoaded = true;
		};

		function loadParcels() {
			if (layerSelectionElement.value === '' || layerSelectionElement.value === 'none') {
				return;
			}
			farmbuild.webmapping.parcels.load('https://farmbuild-wfs-stg.agriculture.vic.gov.au/geoserver/farmbuild/ows',
				olmap.getView().calculateExtent(olmap.getSize()), featureProjection, featureProjection);
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

			/** it is recommended to use these helper functions to create you farm and paddocks layers */
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
				}).extend([new ol.interaction.DragPan({kinetic: null})])
			})
		}

		function mapOnPointerMove(event) {
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
			if (featureAtCoordinate && !actions.isDrawing()) {
				actions.enableEditing();
			}
			if (!featureAtCoordinate && !actions.isEditing()) {
				actions.enableDrawing();
			}
		}

		function mapOnDblClick(event) {
			var coordinate = event.coordinate,
				paddockAtCoordinate = webmapping.paddocks.findByCoordinate(coordinate, olmap.getLayers().item(0));
			if (paddockAtCoordinate && actions.isEditing()) {
				actions.enableDonutDrawing();
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

		function keyboardActions(event) {
			var selectedFeatures = actions.selectedFeatures();
			if (!selectedFeatures) {
				return;
			}

			if (event.keyCode == 46 || event.keyCode == 8) {
				var selectedLayer = layerSelectionElement.value;
				if (selectedLayer === 'farm') {
					$scope.removeFarm();
				}
				if (selectedLayer === 'paddocks') {
					$scope.removeSelectedPaddock();
				}
				event.preventDefault();
				event.stopPropagation();
				return false;
			}

			if (event.keyCode == 13) {

				if (actions.isDrawing()) {
					actions.finishDrawing();
				} else {
					clipSelectedPaddock();
				}

				event.preventDefault();
				event.stopPropagation();
				return false;
			}

			if (event.keyCode == 27) {
				actions.discardDrawing();
				event.preventDefault();
				event.stopPropagation();
				return false;
			}

		};

		function clipSelectedPaddock() {
			$log.info('Clipping selected paddock...');
			var selectedPaddock;
			if (actions.selectedFeatures() && actions.selectedFeatures().item(0) && layerSelectionElement.value === 'paddocks') {
				selectedPaddock = actions.selectedFeatures().item(0);
				olmap.getLayers().item(0).getSource().removeFeature(selectedPaddock);
				actions.clip(selectedPaddock, olmap.getLayers().item(0).getSource(), olmap.getLayers().item(1).getSource());
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
			if (actions.isDrawing()) {
				actions.finishDrawing();
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
			var selectedPaddocks = actions.selectedFeatures();
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
			actions.selectedFeatures().item(0).setProperties({
				name: $scope.farmData.selectedPaddockName
			});
			onPaddockChanged();
		};

		$scope.enableDonutDrawing = function () {
			actions.enableDonutDrawing();
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

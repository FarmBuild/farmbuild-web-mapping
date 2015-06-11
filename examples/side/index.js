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
		$scope.selectedPaddock = {
			name: '',
			type: '',
			comment: ''
		};
		$scope.donutDrawing = false;
		$scope.farmSelected = false;

		$scope.toGeoJson = function () {
			farmbuild.webmapping.exportGeoJson(document, $scope.farmData);
		};

		$scope.toKml = function () {
			farmbuild.webmapping.exportKml(document, $scope.farmData);
		};

		$scope.destroyGmap = function(){
			var gmapEl = document.getElementById('gmap'),
				gmapParentEl = gmapEl.parentNode;
			gmap.unbindAll();
			gmap = null;
			gmapParentEl.removeChild(gmapEl);
			gmapEl = document.createElement('div');
			gmapEl.id= 'gmap';
			gmapEl.className = 'fill';
			gmapParentEl.appendChild(gmapEl);
			gmapElement = gmapEl;
		}

		$scope.reloadG = function(gmapType){
			var targetElement = document.getElementById('olmap');
			$scope.destroyGmap();
			gmap = createGoogleMap(gmapType);

			/** Openlayers 3 does not support google maps as a tile layer,
			 so we need to keep openlayers map view and google maps in sync,
			 this helper function does the job for you. */
			olHelper.integrateGMap(gmap, olmap, dataProjection, targetElement, false);
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
			olmap = createOpenLayerMap(geoJsons);

			/**  Create google map object, customise the map object as you like. */
			gmap = createGoogleMap(google.maps.MapTypeId.SATELLITE);

			/** Openlayers 3 does not support google maps as a tile layer,
			 so we need to keep openlayers map view and google maps in sync,
			 this helper function does the job for you. */
			//olHelper.integrateGMap(gmap, olmap, dataProjection);
			olHelper.integrateGMap(gmap, olmap, dataProjection, document.getElementById('olmap'), true);

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
		function createGoogleMap(type) {
			return new google.maps.Map(gmapElement, {
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
			var farmLayer = olHelper.farmLayer(geoJsons.farm, dataProjection, featureProjection),
				paddocksLayer = olHelper.paddocksLayer(geoJsons.paddocks, dataProjection, featureProjection),
				vicMapImageryLayer = new ol.layer.Tile({
					title: 'VicMAP Imagery',
					type: 'base',
					visible: false,
					source: new ol.source.TileWMS({
						url: 'http://api.maps.vic.gov.au/vicmapapi-mercator/map-wm/wms',
						params: {LAYERS: 'SATELLITE_WM', VERSION: '1.1.1'}
					})
				}),
			vicMapStreetLayer = new ol.layer.Tile({
					title: 'VicMAP Street',
					type: 'base',
					visible: false,
					source: new ol.source.TileWMS({
						url: 'http://api.maps.vic.gov.au/vicmapapi-mercator/map-wm/wms',
						params: {LAYERS: 'WEB_MERCATOR', VERSION: '1.1.1'}
					})
				}),
			googleImageryLayer = new ol.layer.Tile({
					title: 'Google Imagery',
					type: 'base',
					visible: true
				}),
			googleStreetLayer = new ol.layer.Tile({
					title: 'Google Street',
					type: 'base',
					visible: false
				});

			return new ol.Map({
				layers: [new ol.layer.Group({
					'title': 'Base maps',
					layers: [vicMapImageryLayer, vicMapStreetLayer, googleStreetLayer, googleImageryLayer]
				}),
					new ol.layer.Group({
						'title': 'Farm layers',
						layers: [paddocksLayer, farmLayer]
					})],
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
				selectedLayer = olmap.getLayers().item(1).getLayers().item(0);
			}
			if (selectedLayer === "farm") {
				selectedLayer = olmap.getLayers().item(1).getLayers().item(1);
			}
			featureAtCoordinate = webmapping.paddocks.findByCoordinate(coordinate, selectedLayer);
			if (featureAtCoordinate && !actions.drawing.isDrawing()) {
				actions.editing.enable();
			}
			if (!featureAtCoordinate && !actions.editing.isEditing()) {
				actions.drawing.enable();
			}
		}

		function mapOnDblClick(event) {
			var coordinate = event.coordinate,
				paddockAtCoordinate = webmapping.paddocks.findByCoordinate(coordinate, olmap.getLayers().item(1).getLayers().item(0));
			if (paddockAtCoordinate && actions.editing.isEditing()) {
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
				paddockAtCoordinate = webmapping.paddocks.findByCoordinate(coordinate, olmap.getLayers().item(1).getLayers().item(0));
			if ($scope.paddockChanged) {
				$scope.cancel();
			}
			if ((selectedLayer !== 'paddocks') || !paddockAtCoordinate) {
				$scope.selectedPaddock = {};
				$scope.$apply();
				return;
			}
			$scope.selectedPaddock = paddockAtCoordinate.getProperties();
			$scope.selectedPaddock.area = measurement.area(paddockAtCoordinate);
			$log.info('Paddock selected: ' + $scope.selectedPaddock.name);
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
			actions.init(olmap, olmap.getLayers().item(1).getLayers().item(1), olmap.getLayers().item(1).getLayers().item(0), selectedLayer);
			olmap.on('pointermove', mapOnPointerMove);
			olmap.on('dblclick', mapOnDblClick);
			olmap.on('click', mapOnClick);
			olmap.getLayers().item(1).getLayers().item(0).getSource().on('changefeature', onPaddockChanged);
			olmap.getLayers().item(1).getLayers().item(1).getSource().on('changefeature', onFarmChanged);
			loadParcels();
		}

		function clipSelectedPaddock() {
			$log.info('Clipping selected paddock...');
			var selectedPaddock;
			if (actions.features.selected() && actions.features.selected().item(0) && layerSelectionElement.value === 'paddocks') {
				selectedPaddock = actions.features.selected().item(0);
				actions.features.clip(selectedPaddock, olmap.getLayers().item(1).getLayers().item(0).getSource(), olmap.getLayers().item(1).getLayers().item(1).getSource());
			}
		};

		$scope.loadFarmData();

		$scope.exportFarmData = function (farmData) {
			var paddocksGeometry = olHelper.exportGeometry(olmap.getLayers().item(1).getLayers().item(0).getSource(), dataProjection, featureProjection);
			var farmGeometry = olHelper.exportGeometry(olmap.getLayers().item(1).getLayers().item(1).getSource(), dataProjection, featureProjection);
			webmapping.export(document, farmData, {paddocks: paddocksGeometry, farm: farmGeometry});
		};

		$scope.clear = function () {
			$scope.farmData = {};
			webmapping.session.clear();
			location.href = '../index.html'
		}

		$scope.apply = function () {
			$log.info('apply changes to farm data ...');
			if (actions.drawing.isDrawing()) {
				actions.drawing.finish();
			} else {
				clipSelectedPaddock();
			}
			var paddocksGeometry = olHelper.exportGeometry(olmap.getLayers().item(1).getLayers().item(0).getSource(), dataProjection, featureProjection);
			var farmGeometry = olHelper.exportGeometry(olmap.getLayers().item(1).getLayers().item(1).getSource(), dataProjection, featureProjection);

			if (farmGeometry.features.length === 0) {
				$log.error('Draw farm boundary first!');
				return;
			}
			$scope.farmData = webmapping.save({paddocks: paddocksGeometry, farm: farmGeometry});
			olHelper.updateExtent(olmap);
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
			onFarmChanged();
		};

		$scope.removeFarm = function () {
			$log.info('removing farm...');
			var farmFeature = olmap.getLayers().item(1).getLayers().item(1).getSource().getFeatures();
			actions.features.remove(farmFeature);
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

			actions.init(olmap, olmap.getLayers().item(1).getLayers().item(1), olmap.getLayers().item(1).getLayers().item(0), selectedLayer);
			olmap.on('pointermove', mapOnPointerMove);
			olmap.on('dblclick', mapOnDblClick);
			olmap.on('click', mapOnClick);
			olmap.getLayers().item(1).getLayers().item(0).getSource().on('changefeature', onPaddockChanged);
			olmap.getLayers().item(1).getLayers().item(1).getSource().on('changefeature', onFarmChanged);
			loadParcels();
			$scope.farmChanged = false;
			$scope.paddockChanged = false;
			if (selectedLayer === 'farm') {
				$scope.farmSelected = true;
			}
		};

		$scope.onFarmNameChanged = function () {
			olmap.getLayers().item(1).getLayers().item(1).getSource().getFeatures()[0].setProperties({
				name: $scope.farmData.name
			});
			onFarmChanged();
		};

		$scope.onPaddockDetailsChanged = function () {
			var sp = $scope.selectedPaddock;
			actions.features.selected().item(0).setProperties({
				type: sp.type,
				name: sp.name,
				comment: sp.comment,
				area: sp.area
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

		$rootScope.$on('web-mapping-draw-end', function () {
			$scope.farmChanged = true;
		});

		$rootScope.$on('web-mapping-measure-end', function (event, data) {
			$scope.measuredValue = data.value;
			$scope.measuredUnit = data.unit;
			$scope.$apply();
		});

		$rootScope.$on('web-mapping-base-layer-change', function (event, data) {
			if(data.layer.getProperties().title ===  'Google Street'){
				$scope.reloadG();
				return;
			}
			if(data.layer.getProperties().title ===  'Google Imagery'){
				$scope.reloadG(google.maps.MapTypeId.SATELLITE);
				return;
			}
		});

	});

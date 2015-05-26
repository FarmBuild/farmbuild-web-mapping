angular.module('farmbuild.webmapping.examples', ['farmbuild.webmapping'])

	.run(function ($rootScope) {
		$rootScope.appVersion = farmbuild.examples.webmapping.version;
	})

	.controller('MapCtrl',
	function ($scope, $log, $location, webmapping, googleaddresssearch, openLayers, interactions) {

		var dataProjectionCode = 'EPSG:4283',
			featureProjectionCode = 'EPSG:3857',
			dataProjection = ol.proj.get({code: dataProjectionCode}),
			maxZoom = 21,
			defaults = {
				centerNew: [-36.22488327137526, 145.5826132801325],
				zoomNew: 6
			},
			layerSelectionElement = document.getElementById('layers'),
			gmapElement = document.getElementById('gmap'),
			gmap,
			farmLayer,
			paddocksLayer,
			olmap;

		$scope.farmData = {};
		$scope.farmChanged = false;
		$scope.noResult = $scope.farmLoaded = false;
		$scope.selectedPaddockName = '';

		$scope.loadFarmData = function () {
			$scope.farmData = webmapping.find();

			var geoJsons = webmapping.toGeoJsons($scope.farmData);

			if (!angular.isDefined(geoJsons)) {
				$scope.noResult = true;
				return;
			}

			olmap = createOpenLayerMap(geoJsons);

			gmap = createGoogleMap();

			openLayers.integrateGMap(gmap, olmap, dataProjectionCode);

			googleaddresssearch.init('locationautocomplete', dataProjectionCode);

			$scope.farmLoaded = true;

			//webmapping.ga.track('AgSmart');

			layerSelectionElement.addEventListener('change', selectLayer);

			gmapElement.addEventListener('keydown', keyboardActions);

		};

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

		function createOpenLayerMap(geoJsons) {
			farmLayer = openLayers.farmLayer(geoJsons.farm, dataProjectionCode, featureProjectionCode),
				paddocksLayer = openLayers.paddocksLayer(geoJsons.paddocks, dataProjectionCode, featureProjectionCode);
			return new ol.Map({
				layers: [paddocksLayer, farmLayer],
				target: 'olmap',
				keyboardEventTarget: gmapElement,
				view: new ol.View({
					rotation: 0,
					projection: dataProjection,
					maxZoom: maxZoom
				}),
				interactions: ol.interaction.defaults({
					altShiftDragRotate: false,
					dragPan: false,
					rotate: false,
					mouseWheelZoom: true
				}).extend([new ol.interaction.DragPan({kinetic: null})]),
				controls: ol.control.defaults({
					attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
						collapsible: false
					})
				}).extend([
					new ol.control.ZoomToExtent({
						extent: farmLayer.getSource().getExtent()
					}),
					new ol.control.ScaleLine()
				])
			})
		}

		function mapOnPointerMove(event) {
			var selectedLayer = layerSelectionElement.value, coordinate = event.coordinate,
				paddocksSource = paddocksLayer.getSource();
			if (selectedLayer === "paddocks") {
				selectedLayer = paddocksLayer;
			}
			if (selectedLayer === "farm") {
				selectedLayer = farmLayer;
			}
			if (paddocksSource.getFeaturesAtCoordinate(coordinate).length > 0 && !interactions.isDrawing()) {
				interactions.enableEditing();
			}
			if (selectedLayer.getSource().getFeaturesAtCoordinate(event.coordinate).length === 0 && !interactions.isEditing()) {
				interactions.enableDrawing();
			}
		}

		function mapOnDblClick(event) {
			var coordinate = event.coordinate,
				paddocksSource = paddocksLayer.getSource();
			if (paddocksSource.getFeaturesAtCoordinate(coordinate).length > 0 && interactions.isEditing()) {
				interactions.enableDonutDrawing();
			}
		}

		function mapOnClick(event) {
			var coordinate = event.coordinate,
				paddocksSource = paddocksLayer.getSource();
			if (paddocksSource.getFeaturesAtCoordinate(coordinate).length > 0) {
				$scope.selectedPaddockName = paddocksLayer.getSource().getFeaturesAtCoordinate(event.coordinate)[0].getProperties().name;
				$scope.$apply();
				$log.info('Paddock selected: ' + $scope.selectedPaddockName);
			}
		}

		function selectLayer() {
			var selectedLayer = this.value;

			if (selectedLayer === 'none' || selectedLayer === '') {
				interactions.destroy(olmap);
				olmap.un('pointermove', mapOnPointerMove);
				olmap.un('dblclick', mapOnDblClick);
				olmap.un('click', mapOnClick);
				return;
			}

			interactions.init(olmap, farmLayer, paddocksLayer, selectedLayer);
			olmap.on('pointermove', mapOnPointerMove);
			olmap.on('dblclick', mapOnDblClick);
			olmap.on('click', mapOnClick);
		}

		function keyboardActions(event) {
			var selectedFeatures = interactions.selectedFeatures();
			if (!selectedFeatures) {
				return;
			}
			if (event.keyCode == 46 || event.keyCode == 8) {
				$scope.removeSelectedPaddocks();
				event.preventDefault();
				event.stopPropagation();
				return false;
			}

			if (event.keyCode == 13) {
				if (selectedFeatures.getLength() > 1) {
					$scope.mergeSelectedPaddocks();
				}
				if (selectedFeatures.getLength() === 1) {
					$scope.clipSelectedPaddock();
				}
			}
		}

		$scope.loadFarmData();

		$scope.exportFarmData = function (farmData) {
			webmapping.export(document, farmData);
		};

		$scope.clear = function () {
			$scope.farmData = {};
			webmapping.session.clear();
			location.href = '../index.html'
		}

		$scope.apply = function () {
			$log.info('apply...');
			$scope.saveToSessionStorage('farmData', angular.toJson($scope.farmData));
			$scope.farmChanged = false;
		};

		$scope.removeSelectedPaddocks = function () {
			$log.info('removing selected paddock(s)...');
			var selectedPaddocks = interactions.selectedFeatures();
			interactions.remove(selectedPaddocks);
			$scope.farmChanged = false;
		};

		$scope.clipSelectedPaddock = function () {
			$log.info('Clipping selected paddock...');
			var selectedPaddock = interactions.selectedFeatures().item(0);
			paddocksLayer.getSource().removeFeature(selectedPaddock);
			interactions.clip(selectedPaddock, paddocksLayer.getSource(), farmLayer.getSource());
			$scope.farmChanged = false;
		};

		$scope.mergeSelectedPaddocks = function () {
			$log.info('Merging selected paddocks...');
			interactions.merge(interactions.selectedFeatures());
			$scope.farmChanged = false;
		};

		$scope.cancel = function () {
			$log.info('cancel...');
			$scope.farmData = findInSessionStorage();
			$scope.farmChanged = false;
		};

	});

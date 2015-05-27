angular.module('farmbuild.webmapping.examples', ['farmbuild.webmapping'])

	.run(function ($rootScope) {
		$rootScope.appVersion = farmbuild.examples.webmapping.version;
	})

	.controller('MapCtrl',
	function ($scope, $log, $location, webmapping) {

		var dataProjectionCode = 'EPSG:4283',
			featureProjectionCode = 'EPSG:3857',
			openLayersProjectionCode = 'EPSG:4326',
			maxZoom = 21,
			layerSelectionElement = document.getElementById('layers'),
			gmapElement = document.getElementById('gmap'),
			gmap,
			farmLayer,
			paddocksLayer,
			olmap,
			actions = webmapping.actions,
			olHelper = webmapping.olHelper,
			googleAddressSearch = webmapping.googleAddressSearch;

		$scope.farmData = {};
		$scope.farmChanged = false;
		$scope.paddockChanged = false;
		$scope.noResult = $scope.farmLoaded = false;
		$scope.selectedPaddockName = '';

		$scope.loadFarmData = function () {
			$scope.farmData = webmapping.find();

			var geoJsons = webmapping.toGeoJsons($scope.farmData);

			if (!angular.isDefined(geoJsons)) {
				$scope.noResult = true;
				return;
			}

			olmap = createOpenLayerMap($scope.farmData.geometry.crs, geoJsons);

			gmap = createGoogleMap();

			olHelper.integrateGMap(gmap, olmap, dataProjectionCode);

			googleAddressSearch.init('locationautocomplete', openLayersProjectionCode, olmap);

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

		function createOpenLayerMap(crsName, geoJsons) {
			farmLayer = olHelper.farmLayer(geoJsons.farm, dataProjectionCode, featureProjectionCode),
				paddocksLayer = olHelper.paddocksLayer(geoJsons.paddocks, dataProjectionCode, featureProjectionCode);
			var dataProjection = ol.proj.get({code: crsName});

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
				featureAtCoordinate;
			if (selectedLayer === "paddocks" || selectedLayer === "paddocksMulti") {
				selectedLayer = paddocksLayer;
			}
			if (selectedLayer === "farm") {
				selectedLayer = farmLayer;
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
				paddockAtCoordinate = webmapping.paddocks.findByCoordinate(coordinate, paddocksLayer);
			if (paddockAtCoordinate && actions.isEditing()) {
				actions.enableDonutDrawing();
			}
		}

		function onPaddockChanged(e) {
			$scope.paddockChanged = true;
			$scope.$apply();
		}

		function mapOnClick(event) {
			var coordinate = event.coordinate,
				paddockAtCoordinate =  webmapping.paddocks.findByCoordinate(coordinate, paddocksLayer);
			if (!paddockAtCoordinate) {
				$scope.selectedPaddockName = '';
				$scope.$apply();
				return;
			}
			$scope.selectedPaddockName = paddockAtCoordinate.getProperties().name;
			$log.info('Paddock selected: ' + $scope.selectedPaddockName);
			$scope.$apply();
		}

		function selectLayer() {
			var selectedLayer = this.value, multi = (selectedLayer === 'paddocksMulti');

			if (selectedLayer === "paddocksMulti") {
				selectedLayer = 'paddocks';
			}

			if (selectedLayer === 'none' || selectedLayer === '') {
				actions.destroy(olmap);
				olmap.un('pointermove', mapOnPointerMove);
				olmap.un('dblclick', mapOnDblClick);
				olmap.un('click', mapOnClick);
				return;
			}

			actions.destroy(olmap);
			actions.init(olmap, farmLayer, paddocksLayer, selectedLayer, multi);
			olmap.on('pointermove', mapOnPointerMove);
			olmap.on('dblclick', mapOnDblClick);
			olmap.on('click', mapOnClick);
			paddocksLayer.getSource().on('changefeature', onPaddockChanged)
		}

		function keyboardActions(event) {
			var selectedFeatures = actions.selectedFeatures();
			if (!selectedFeatures) {
				return;
			}

			if (event.keyCode == 46 || event.keyCode == 8) {
				$scope.removeSelectedPaddock();
				event.preventDefault();
				event.stopPropagation();
				return false;
			}

			if (event.keyCode == 13) {

				if(actions.isDrawing()){
					actions.finishDrawing();
				}

				if (selectedFeatures.getLength() > 1) {
					mergeSelectedPaddocks();
				}

				if (selectedFeatures.getLength() === 1) {
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

		function mergeSelectedPaddocks() {
			$log.info('Merging selected paddocks...');
			actions.merge(actions.selectedFeatures());
			$scope.farmChanged = false;
		};

		function clipSelectedPaddock() {
			$log.info('Clipping selected paddock...');
			var selectedPaddock = actions.selectedFeatures().item(0);
			paddocksLayer.getSource().removeFeature(selectedPaddock);
			actions.clip(selectedPaddock, paddocksLayer.getSource(), farmLayer.getSource());
			$scope.farmChanged = false;
		};

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
			$log.info('apply changes to farm data ...');
			if(actions.isDrawing()) {
				actions.finishDrawing();
			} else {
				clipSelectedPaddock();
			}
			var paddocksGeometry = angular.fromJson(olHelper.exportGeometry(paddocksLayer.getSource()));
			var farmGeometry = angular.fromJson(olHelper.exportGeometry(farmLayer.getSource()));
			farmGeometry.features[0].geometry.crs = {
				properties: {
					name: "EPSG:4283"
				}
			};
			webmapping.save({paddocks: paddocksGeometry, farm: farmGeometry});
			$scope.farmChanged = false;
			$scope.paddockChanged = false;
		};

		$scope.removeSelectedPaddock = function () {
			$log.info('removing selected paddock(s)...');
			var selectedPaddocks = actions.selectedFeatures();
			actions.remove(selectedPaddocks);
			$scope.farmChanged = false;
		};

		$scope.cancel = function () {
			$log.info('cancel...');
			$scope.farmData = findInSessionStorage();
			$scope.farmChanged = false;
		};

	});

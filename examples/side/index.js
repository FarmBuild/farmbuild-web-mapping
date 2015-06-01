angular.module('farmbuild.webmapping.examples', ['farmbuild.webmapping'])

    .run(function ($rootScope) {
        $rootScope.appVersion = farmbuild.examples.webmapping.version;
    })

    .controller('MapCtrl',
    function ($scope, $log, $location, $rootScope, webmapping) {

        var dataProjectionCode,
            featureProjectionCode = 'EPSG:3857',
            openLayersProjectionCode = 'EPSG:4326',
            maxZoom = 21,
            layerSelectionElement = document.getElementById('layers'),
            gmapElement = document.getElementById('gmap'),
            gmap,
            olmap,
            actions = webmapping.actions,
            olHelper = webmapping.olHelper,
            googleAddressSearch = webmapping.googleAddressSearch;

        $scope.farmData = {};
        $scope.farmChanged = false;
        $scope.paddockChanged = false;
        $scope.noResult = $scope.farmLoaded = false;
        $scope.farmData.selectedPaddockName = '';
        $scope.donutDrawing = false;

        $scope.loadFarmData = function () {
            $scope.farmData = webmapping.find();

            var geoJsons = webmapping.toGeoJsons($scope.farmData);

            if (!angular.isDefined(geoJsons)) {
                $scope.noResult = true;
                return;
            }

            dataProjectionCode = $scope.farmData.geometry.crs;

            olmap = createOpenLayerMap(geoJsons);

            gmap = createGoogleMap();

            olHelper.integrateGMap(gmap, olmap, dataProjectionCode);

            googleAddressSearch.init('locationautocomplete', openLayersProjectionCode, olmap);

            $scope.farmLoaded = true;

            layerSelectionElement.addEventListener('change', selectLayer);

            gmapElement.addEventListener('keydown', keyboardActions);

            webmapping.ga.trackWebMapping('AgSmart');

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
            var farmLayer = olHelper.farmLayer(geoJsons.farm, dataProjectionCode, featureProjectionCode),
                paddocksLayer = olHelper.paddocksLayer(geoJsons.paddocks, dataProjectionCode, featureProjectionCode);

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
            //var measure = actions.measureLength(olmap);
            //console.log(measure.getValue());
            //webMappingParcels.load('http://sv079.sv.domain:8080/geoserver/farmbuild/ows', olmap.getView().calculateExtent(olmap.getSize()),'EPSG:3857', 'EPSG:3857');
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
            $scope.farmData.selectedPaddockArea = paddockAtCoordinate.getGeometry().getArea() * 0.0001;
            $log.info('Paddock selected: ' + $scope.farmData.selectedPaddockName);
            $scope.$apply();
        }

        function selectLayer() {
            var selectedLayer = this.value;

            if (selectedLayer === 'none' || selectedLayer === '') {
                actions.destroy(olmap);
                olmap.un('pointermove', mapOnPointerMove);
                olmap.un('dblclick', mapOnDblClick);
                olmap.un('click', mapOnClick);
                return;
            }

            actions.destroy(olmap);
            actions.init(olmap, olmap.getLayers().item(1), olmap.getLayers().item(0), selectedLayer);
            olmap.on('pointermove', mapOnPointerMove);
            olmap.on('dblclick', mapOnDblClick);
            olmap.on('click', mapOnClick);
            olmap.getLayers().item(0).getSource().on('changefeature', onPaddockChanged);
            olmap.getLayers().item(1).getSource().on('changefeature', onFarmChanged);
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
            var paddocksGeometry = olHelper.exportGeometry(olmap.getLayers().item(0).getSource(), dataProjectionCode, featureProjectionCode);
            var farmGeometry = olHelper.exportGeometry(olmap.getLayers().item(1).getSource(), dataProjectionCode, featureProjectionCode);

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
            var paddocksGeometry = olHelper.exportGeometry(olmap.getLayers().item(0).getSource(), dataProjectionCode, featureProjectionCode);
            var farmGeometry = olHelper.exportGeometry(olmap.getLayers().item(1).getSource(), dataProjectionCode, featureProjectionCode);

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

            olHelper.reload(olmap, geoJsons, dataProjectionCode, featureProjectionCode);

            actions.init(olmap, olmap.getLayers().item(1), olmap.getLayers().item(0), selectedLayer);
            olmap.on('pointermove', mapOnPointerMove);
            olmap.on('dblclick', mapOnDblClick);
            olmap.on('click', mapOnClick);
            olmap.getLayers().item(0).getSource().on('changefeature', onPaddockChanged);
            olmap.getLayers().item(1).getSource().on('changefeature', onFarmChanged);

            $scope.farmChanged = false;
            $scope.paddockChanged = false;
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

        $rootScope.$on('mapdrawend', function(){
            $scope.farmChanged = true;
        });

    });

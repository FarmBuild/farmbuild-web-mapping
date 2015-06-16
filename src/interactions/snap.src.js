'use strict';

angular.module('farmbuild.webmapping')
	.factory('webMappingSnapInteraction',
	function (validations,
	          $log) {
		var _isDefined = validations.isDefined;

		function _create(map, farmSource, paddocksSource) {

			if(!_isDefined(map) || !_isDefined(farmSource) || !_isDefined(paddocksSource)){
				$log.error('There is a problem with input parameters, please refer to api for more information');
				return;
			}

			var snapInteraction = new ol.interaction.Snap({
				source: paddocksSource
			}), snapVisibleLayer;

			snapInteraction.addFeature(farmSource.getFeatures()[0]);

			function _enable() {
				snapInteraction.setActive(true);
			}

			function _disable() {
				snapInteraction.setActive(false);
			}

			snapVisibleLayer = new ol.layer.Vector({
				source: (new ol.source.Vector()),
				title: 'Rural Parcels',
				style: new ol.style.Style({
					stroke: new ol.style.Stroke({
						color: 'rgba(238,238,238,.7)',
						width: 1
					})
				})
			});

			map.addLayer(snapVisibleLayer);

			function _addFeatures(parcels) {
				parcels.forEach(function (parcel) {
					snapInteraction.addFeature(parcel);
				});
				snapVisibleLayer.getSource().addFeatures(parcels);
			}

			function _init(active) {
				$log.info('snap interaction init ...');
				map.addInteraction(snapInteraction);
				snapInteraction.setActive(active);
			}

			function _destroy(map) {
				if(!_isDefined(map)){
					$log.error('There is a problem with input parameters, map object is not defined');
					return;
				}
				map.removeLayer(snapVisibleLayer);
				map.removeInteraction(snapInteraction)
			}

			return {
				init: _init,
				enable: _enable,
				disable: _disable,
				addFeatures: _addFeatures,
				interaction: snapInteraction,
				destroy: _destroy
			};

		};

		return {
			create: _create
		}

	});

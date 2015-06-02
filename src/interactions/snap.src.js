'use strict';

angular.module('farmbuild.webmapping')
	.factory('webMappingSnapInteraction',
	function (validations,
	          $log) {
		var _isDefined = validations.isDefined;

		function _create(map, farmSource, paddocksSource) {

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
				style: new ol.style.Style({
					stroke: new ol.style.Stroke({
						color: 'rgba(204,204,204,0.5)',
						width: 2
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

			function _init() {
				$log.info('snap interaction init ...');
				map.addInteraction(snapInteraction);
				snapInteraction.setActive(false);
			}

			function _destroy(map) {
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
'use strict';

angular.module('farmbuild.webmapping')
    .factory('webMappingMeasureInteraction',
    function (validations,
              webMappingMeasurement,
              $log) {
        var _isDefined = validations.isDefined,
            _measurement = webMappingMeasurement,
            _value, _type;

        function _create(map, type) {
            _type = type;
            /**
             * Currently drawn feature.
             * @type {ol.Feature}
             */
            var sketch,

                source = new ol.source.Vector(),

                drawInteraction = new ol.interaction.Draw({
                    source: source,
                    type: /** @type {ol.geom.GeometryType} */ (type),
                    style: new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: 'rgba(255, 255, 255, 0.2)'
                        }),
                        stroke: new ol.style.Stroke({
                            color: 'rgba(0, 0, 0, 0.5)',
                            lineDash: [10, 10],
                            width: 2
                        }),
                        image: new ol.style.Circle({
                            radius: 5,
                            stroke: new ol.style.Stroke({
                                color: 'rgba(0, 0, 0, 0.7)'
                            }),
                            fill: new ol.style.Fill({
                                color: 'rgba(255, 255, 255, 0.2)'
                            })
                        })
                    })
                });

            drawInteraction.on('drawstart',
                function (evt) {
                    // set sketch
                    sketch = evt.feature;
                }, this);

            drawInteraction.on('drawend',
                function (evt) {
                    // unset sketch
                    sketch = null;
                }, this);


            /**
             * Handle pointer move.
             * @param {ol.MapBrowserEvent} evt
             */
            function onPointerMove(evt) {
                if (evt.dragging || !sketch) {
                    return;
                }
                if(_type === 'Polygon') {
                    _value =  _measurement.area(sketch);
                } else {
                    _value =  _measurement.length(sketch);
                }
            };

            function _getValue() {
                return _value;
            };


            map.addInteraction(drawInteraction);
            drawInteraction.setActive(true);
            map.on('pointermove', onPointerMove);

            return {
                getValue: _getValue,
                interaction: drawInteraction
            }

        };

        return {
            create: _create
        }

    });
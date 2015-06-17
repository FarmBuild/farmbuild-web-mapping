/**
 * @since 0.0.1
 * @copyright 2015 State of Victoria.

 * @author State of Victoria
 * @version 1.0.0
 */

'use strict';

/**
 * webmapping/snapControl singleton
 * @private-module webmapping/snapControl
 */

angular.module('farmbuild.webmapping')
  .factory('webMappingSnapControl',
  function (validations,
            $rootScope,
            $log) {
    var _isDefined = validations.isDefined;

      /**
       * @constructor
       * @extends {ol.control.Control}
       * @param {Object=} opt_options Control options.
       */
    function _create() {
      var baseCssClass = 'snap ol-unselectable ol-control ';
      var letter = 'S', options = {};
        var button = document.createElement('button');
        button.innerHTML = letter;

        function toggle(e) {
          var eventToCast;
          if(farmbuild.webmapping.actions.snapping.active()){
            farmbuild.webmapping.actions.snapping.disable();
            eventToCast = 'web-mapping-snap-disabled';
            element.className = baseCssClass;
            element.title = 'Enable snapping';
          } else {
            farmbuild.webmapping.actions.snapping.enable();
            eventToCast = 'web-mapping-snap-enabled';
            element.className = baseCssClass + 'active';
            element.title = 'Disable snapping';
          }
          $rootScope.$broadcast(eventToCast)
        };

        button.addEventListener('click', toggle, false);
        button.addEventListener('touchstart', toggle, false);

        var element = document.createElement('div');
        element.className = baseCssClass + ' active';
        element.title = 'Disable snapping';
        element.appendChild(button);

        ol.control.Control.call(this, {
          element: element,
          target: options.target
        });

    };

    ol.inherits(_create, ol.control.Control);


    return {
      create: _create
    }

  });

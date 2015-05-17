'use strict';

// Inject modules
angular.module('farmbuild.webmapping').run(function(webmapping){});

// Init api by instantiating angular module internally, users are not tied to angular for using farmbuild.
angular.injector(['ng', 'farmbuild.webmapping']);
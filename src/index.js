'use strict';

// Inject modules
angular.module('farmbuild.webMapping').run(function(webMapping){});

// Init api by instantiating angular module internally, users are not tied to angular for using farmbuild.
angular.injector(['ng', 'farmbuild.webMapping']);
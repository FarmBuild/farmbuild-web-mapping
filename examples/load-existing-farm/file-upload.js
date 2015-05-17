'use strict';

angular.module('farmbuild.webmapping.examples').directive('myFileUpload', function () {
	return {
		restrict: 'A',
		require: 'ngModel',
		scope: false,
		link: function (scope, element, attrs, ngModel) {
			var input;

			element.on('click', function () {
				element.append('<input type="file" class="hidden">');
				input = element.children().last();
				input.on('click', function (e) {
					e.stopImmediatePropagation();
				});
				input.on('change', function (e) {
					var reader = new FileReader();

					reader.onload = function (onLoadEvent) {
						ngModel.$setViewValue(onLoadEvent.target.result);
						scope.$apply();
						input.off();
						input.remove();
					};

					reader.readAsText((e.srcElement || e.target).files[0]);

				});
				input.trigger('click');
			});


			scope.$on('$destroy', function () {
				element.off();
				if (typeof input !== 'undefined') {
					input.off();
				}
			});
		}
	};
});

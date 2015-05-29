'use strict';

describe('farmbuild.webMapping module', function() {
	beforeEach(function() {
		fixture.setBase('examples/data')
	})

	// instantiate service
	var webMappingTransformation, webMapping,
		susanFarmJson = 'farmdata-susan.json',
		$log,
		poly1 = {
		"type": "Feature",
		"properties": {
			"fill": "#0f0"
		},
		"geometry": {
			"type": "Polygon",
			"coordinates": [[
				[-46.738586, -23.596711],
				[-46.738586, -23.458207],
				[-46.560058, -23.458207],
				[-46.560058, -23.596711],
				[-46.738586, -23.596711]
			]]
		}
	};
	var poly2 = {
		"type": "Feature",
		"properties": {
			"fill": "#00f"
		},
		"geometry": {
			"type": "Polygon",
			"coordinates": [[
				[-46.650009, -23.631314],
				[-46.650009, -23.5237],
				[-46.509246, -23.5237],
				[-46.509246, -23.631314],
				[-46.650009, -23.631314]
			]]
		}
	};

	beforeEach(module('farmbuild.webmapping', function($provide) {
		$provide.value('$log', console);
	}));

	beforeEach(inject(function (_webMappingTransformation_, _webmapping_,
	                            _$log_) {
		webMappingTransformation = _webMappingTransformation_;
		webMapping = _webmapping_;
		$log = _$log_;
	}));

	describe('Testing Web Mapping Transformation', function(){
		it('webMappingTransformation should be defined', inject(function() {
			expect(webMapping).toBeDefined();
			expect(webMappingTransformation).toBeDefined();
		}));
	});

	describe('Testing Web Mapping Transformation Erase', function(){
		it('webMappingTransformation.erase should return a Feature<Polygon>', inject(function() {
			var olPoly1 = webMappingTransformation.geoJsonToOpenLayerFeature(poly1, {});
			var olPoly2 = webMappingTransformation.geoJsonToOpenLayerFeature(poly2, {});
			var erased = webMappingTransformation.erase(olPoly1, [olPoly2]);
			expect(erased).toBeDefined();
		}));
	});


	afterEach(function() {
		fixture.cleanup()
	});

});

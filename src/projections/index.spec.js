'use strict';

describe('farmbuild.webMapping module', function () {
    var webMappingProjections, farmdata,
        $log;

    beforeEach(module('farmbuild.webmapping', function ($provide) {
        $provide.value('$log', console);
    }));

    beforeEach(inject(function (_webMappingProjections_, _farmdata_,
                                _$log_) {
        webMappingProjections = _webMappingProjections_;
        farmdata = _farmdata_;
        $log = _$log_;
    }));

    describe('Testing Web Mapping Projections', function () {
        it('webMappingProjections should be defined', inject(function () {
            expect(webMappingProjections).toBeDefined();
        }));
    });

    describe('All projection should be defined', function () {
        it('should return projection', inject(function () {
            var dataProjection;
            farmdata.crsSupported.forEach(function(crs) {
                dataProjection = ol.proj.get(crs.name);
                expect(dataProjection).toBeDefined();
                expect(dataProjection.getCode()).toEqual(crs.name);
            });
        }));
    });

});
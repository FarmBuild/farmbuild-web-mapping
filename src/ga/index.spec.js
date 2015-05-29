'use strict';

describe('farmbuild.webmapping module', function() {

    // instantiate service
    var webMappingGoogleAnalytics, $log;

    beforeEach(module('farmbuild.webmapping', function($provide) {
        $provide.value('$log', console);
    }));

    beforeEach(module('farmbuild.webmapping'));

    beforeEach(inject(function (_webMappingGoogleAnalytics_,_$log_) {
        webMappingGoogleAnalytics = _webMappingGoogleAnalytics_;
        $log = _$log_;
    }));

    describe('Track the web mapping ', function(){
        it('webMappingGoogleAnalytics should be defined', inject(function() {
            expect(webMappingGoogleAnalytics).toBeDefined();
        }));

        it('webMappingGoogleAnalytics.track should create a track', inject(function() {
            webMappingGoogleAnalytics.trackWebMapping('AgSmart')
        }));
    });



});

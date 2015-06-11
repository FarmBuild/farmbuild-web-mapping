'use strict';

describe('farmbuild.webmapping module', function() {
  beforeEach(function() {
    fixture.setBase('examples/data')
  })

  // instantiate service
  var webMappingSession, webMapping,
    susanFarmJson = 'farmdata-susan.json',
    $log;

  beforeEach(module('farmbuild.webmapping', function($provide) {
    $provide.value('$log', console);
  }));

  beforeEach(module('farmbuild.webmapping'));

  beforeEach(inject(function (_webMappingSession_, _webmapping_,
                              _$log_) {
    webMappingSession = _webMappingSession_;
    webMapping = _webmapping_;
    $log = _$log_;
  }));

  describe('load an existing calclator from session', function(){
    it('webMappingSession should be defined', inject(function() {
      expect(webMappingSession).toBeDefined();
    }));
  });

  afterEach(function() {
    fixture.cleanup()
  });

});

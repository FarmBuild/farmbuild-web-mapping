/**
 * This blank test shows:
 * notice it's not 'use strict';
 * how to set $log so it ouputs to console
 * how to use the test data using fixture
 */
describe('farmbuild.webmapping module', function() {
  //access test data under data dir
  beforeEach(function() {
    fixture.setBase('examples/data')
  })

  // instantiate log
  var $log,
    webmapping,
    susanFarm = 'farmdata-susan.json';
  beforeEach(module('farmbuild.webmapping', function($provide) {
    $provide.value('$log', console)
  }));

  beforeEach(inject(function (_$log_, _webmapping_) {
    $log = _$log_
    webmapping = _webmapping_
  }))

  describe('Loading susan farm data', function() {
    it('Loading from json file should create geoJson', inject(function() {

      var loaded = fixture.load(susanFarm),
        farmData = webmapping.load(loaded),
        geoJsons = webmapping.toGeoJsons(farmData)

      expect(webmapping.validator.validate(farmData)).toBeDefined()

      expect(webmapping.validator.isGeoJsons(geoJsons)).toBeDefined()

    }))
  })

  afterEach(function() {
    fixture.cleanup()
  });
});

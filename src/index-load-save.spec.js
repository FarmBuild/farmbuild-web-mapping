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

  describe('Loading susan farmData', function() {
    it('Loading from json file should create geoJson', inject(function() {

      var susanFarmData = fixture.load(susanFarm),
        loaded = webmapping.load(susanFarmData),
        geoJsons = webmapping.toGeoJsons(loaded)

      expect(webmapping.validator.validate(loaded)).toBeTruthy()

      expect(webmapping.validator.isGeoJsons(geoJsons.farm)).toBeTruthy()
      expect(webmapping.validator.isGeoJsons(geoJsons.paddocks)).toBeTruthy()

    }))
  })

  describe('Saving the farmData', function() {
    it('Saving farmData', inject(function() {

      var susanFarmData = fixture.load(susanFarm),
        source = angular.copy(susanFarmData),
        loaded = webmapping.load(angular.copy(susanFarmData)),
        geoJsons = webmapping.toGeoJsons(loaded),
        saved = webmapping.save(geoJsons)

      expect(angular.equals(loaded, susanFarmData)).toBeTruthy()

      log(loaded, saved)

      expect(angular.equals(source.name, saved.name)).toBeTruthy()

      expect(angular.equals(source.geometry, saved.geometry)).toBeTruthy()
      expect(angular.equals(source.paddocks.length, saved.paddocks.length)).toBeTruthy()

    }))
  })

  function log(i1, i2) {
    $log.info('i1: %s, i2: %s', i1.name, i2.name)
  }

  afterEach(function() {
    fixture.cleanup()
  });
});

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
    webmappingConverter,webmappingValidator,
    susanFarm = 'farmdata-susan.json';
  beforeEach(module('farmbuild.webmapping', function($provide) {
    $provide.value('$log', console)
  }));

  beforeEach(inject(function (_$log_, _webmappingConverter_, _webmappingValidator_) {
    $log = _$log_,
    webmappingConverter = _webmappingConverter_
    webmappingValidator = _webmappingValidator_
  }))

  describe('Given calling validator.validate should return true or fale', function() {
    it('webmappingConverter should be defined', inject(function() {
      expect(webmappingConverter).toBeDefined()
    }))

    it('Susan farm data should be converted to valid geoJsons', inject(function() {
      var loaded = fixture.load(susanFarm),
        geoJsons = webmappingConverter.toGeoJsons(loaded);

      expect(geoJsons).toBeDefined()
      expect(geoJsons.farm).toBeDefined()
      expect(geoJsons.farm.type).toBeDefined()
      expect(geoJsons.farm.type).toBe('FeatureCollection')

      $log.info('geoJsons.farm:%j', geoJsons.farm)

      expect(webmappingValidator.isGeoJsons(geoJsons.farm)).toBeTruthy()

      expect(geoJsons.paddocks).toBeDefined()
      expect(webmappingValidator.isGeoJsons(geoJsons.paddocks)).toBeTruthy()

      $log.info('geoJsons:%j', geoJsons)
    }))

    it('geoJsons  should be converted to valid farmData', inject(function() {
      var loaded = fixture.load(susanFarm),
        geoJsons = webmappingConverter.toGeoJsons(loaded),
        converted = webmappingConverter.toFarmData(angular.copy(loaded), geoJsons)

      $log.info('converted:%j', converted)

      expect(angular.equals(loaded, converted)).toBeTruthy()
    }))


  })

  afterEach(function() {
    fixture.cleanup()
  });
});

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

    it('Susan farm data should be converted to valid geoJson', inject(function() {
      var loaded = fixture.load(susanFarm),
        geoJson = webmappingConverter.toGeoJson(loaded);

      expect(geoJson).toBeDefined()
      expect(geoJson.farm).toBeDefined()
      expect(webmappingValidator.isGeoJson(geoJson.farm)).toBeDefined()

      expect(geoJson.paddocks).toBeDefined()
      expect(webmappingValidator.isGeoJson(geoJson.paddocks)).toBeDefined()


      $log.info('geoJson:%j', geoJson)
    }))



  })

  afterEach(function() {
    fixture.cleanup()
  });
});

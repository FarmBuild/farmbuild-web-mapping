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
    webmappingValidator,
    susanFarm = 'farmdata-susan.json';
  beforeEach(module('farmbuild.webmapping', function($provide) {
    $provide.value('$log', console)
  }));

  beforeEach(inject(function (_$log_, _webmappingValidator_) {
    $log = _$log_,
      webmappingValidator = _webmappingValidator_
  }))

  describe('Given calling validator.validate should return true or fale', function() {
    it('webmappingValidator should be defined', inject(function() {
      expect(webmappingValidator).toBeDefined()
    }))

    it('Susan farm data should be valid', inject(function() {
      var loaded = fixture.load(susanFarm);
      expect(webmappingValidator.validate(loaded)).toBeDefined()
    }))



  })

  afterEach(function() {
    fixture.cleanup()
  });
});

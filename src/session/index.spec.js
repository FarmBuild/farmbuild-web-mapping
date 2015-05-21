'use strict';

describe('farmbuild.webMapping module', function() {
  beforeEach(function() {
    fixture.setBase('examples/data')
  })

  // instantiate service
  var webMappingSession, webMapping,
    milkSold, fertilizersPurchased,
    susanFarmJson = 'farmdata-susan.json',
    $log;

  beforeEach(module('farmbuild.webMapping', function($provide) {
    $provide.value('$log', console);
  }));

  beforeEach(module('farmbuild.webMapping'));

  beforeEach(inject(function (_webMappingSession_, _webMapping_,
                              _milkSold_,
                              _fertilizersPurchased_,
                              _$log_) {
    webMappingSession = _webMappingSession_;
    webMapping = _webMapping_;
    milkSold = _milkSold_;
    fertilizersPurchased = _fertilizersPurchased_;
    $log = _$log_;
  }));

  describe('load an existing calclator from session', function(){
    it('webMappingSession should be defined', inject(function() {
      expect(webMappingSession).toBeDefined();
    }));
  });

  describe('load an existing farmdata from session', function(){
    it('farmdataSession.load should return null.', inject(function() {
      sessionStorage.setItem('farmdata', null);

      var data = webMappingSession.loadSection();

      expect(data).toBe(undefined);
    }));
  });

  describe('save an existing farmdata to session', function(){

    it('farmdataSession.load.', inject(function() {
      var loaded = fixture.load(susanFarmJson),
        typesSize = 30,
        section = 'fertilizersPurchased';

      loaded = webMapping.load(loaded)

      var found = webMappingSession.loadSection(section);

      expect(found).toBeDefined();
      expect(found.types).toBeDefined();
      expect(found.types.length).toBe(typesSize);
    }));
  });


  afterEach(function() {
    fixture.cleanup()
  });

});

/**
 * This blank test shows:
 * notice it's not 'use strict';
 * how to set $log so it ouputs to console
 * how to use the test data using fixture
 */
describe('farmbuild.webmapping module', function() {
  //access test data under data dir
  beforeEach(function() {
    fixture.setBase('data')
  })

  // instantiate log
  var $log;
  beforeEach(module('farmbuild.webmapping', function($provide) {
    $provide.value('$log', console)
  }));

  beforeEach(inject(function (_$log_) {
    $log = _$log_
  }))

  describe('$log in test should output to console', function() {
    it('$log.info must say hello world', inject(function() {
      $log.info('hello world')
    }))
  })

  afterEach(function() {
    fixture.cleanup()
  });
});

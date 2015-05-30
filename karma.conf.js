module.exports = function(config){
  config.set({

    basePath : '',

    files : [
      'lib/ol/ol-debug.js',
      'bower_components/farmbuild-core/dist/farmbuild-core.js',
      'bower_components/turf/turf.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'bower_components/farmbuild-farmdata/dist/farmbuild-farmdata.js',
      'bower_components/proj4/dist/proj4.js',
      'src/web-mapping.src.js',
      'src/session/index.src.js',
      'src/interactions/*.src.js',
      'src/transformation/*.src.js',
      'src/measurement/*.src.js',
      'src/paddocks/*.src.js',
      'src/openlayers/*.src.js',
      'src/parcels/*.src.js',
      'src/ga/*.src.js',
      'src/google/**/*.src.js',
      'src/projections/index.src.js',
      'src/index.src.js',
//      'src/blank.spec.js',//use this as a basis of creating your module test
//      'src/index-load-save.spec.js',
//      'src/index-load-edit-save.spec.js',
//      'src/**/*.spec.js',
      'src/transformation/*.spec.js',
      {pattern: 'examples/data/*.json'}
    ],

    autoWatch : true,
    frameworks: ['jasmine', 'fixture'],
    browsers : ['Chrome'],
    //logLevel: 'LOG_INFO', //this it NOT application log level, it's karma's log level.
    plugins : [
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-jasmine',
            'karma-junit-reporter',
            'karma-fixture',
            'karma-html2js-preprocessor'
            ],

    junitReporter : {
      outputFile: 'test_out/unit.xml',
      suite: 'unit'
    },
    preprocessors: {
      '**/*.html'   : ['html2js'],
      '**/*.json'   : ['html2js']
    }

  });
};

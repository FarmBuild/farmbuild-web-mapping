module.exports = function(config){
  config.set({

    basePath : '',

    files : [
      'bower_components/farmbuild-core/dist/farmbuild-core.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'bower_components/farmbuild-farmdata/dist/farmbuild-farmdata.js',
      'node_modules/geojsonhint/geojsonhint.js',
      'src/web-mapping.src.js',
      'src/session/index.src.js',
      'src/validator/index.src.js',
      'src/converter/index.src.js',
      'src/index.src.js',
      'src/blank.spec.js',//use this as a basis of creating your module test
//      'src/validator/geojsonhint.spec.js',
//      'src/validator/index.spec.js',
      'src/converter/index.spec.js',
//      'src/index-load.spec.js',
//      'src/**/*.spec.js',
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

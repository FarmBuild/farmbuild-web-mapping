module.exports = function (config) {
	config.set({

		basePath: '',

		files: [
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
			'src/converter/*.src.js',
			'src/geoprocessing/*.src.js',
			'src/measurement/*.src.js',
			'src/paddocks/*.src.js',
			'src/openlayers/*.src.js',
			'src/parcels/*.src.js',
			'src/print/*.src.js',
			'src/controls/**/*.src.js',
			'src/google/**/*.src.js',
			'src/projections/index.src.js',
			'src/index.src.js',
			'src/**/*.spec.js',
			{pattern: 'examples/data/*.json'}
		],

		autoWatch: true,
		frameworks: ['jasmine', 'fixture'],
		browsers: ['Chrome'],
		plugins: [
			'karma-chrome-launcher',
			'karma-firefox-launcher',
			'karma-jasmine',
			'karma-junit-reporter',
			'karma-fixture',
			'karma-html2js-preprocessor',
			'karma-json-fixtures-preprocessor'
		],

		junitReporter: {
			outputFile: 'test_out/unit.xml',
			suite: 'unit'
		},
		preprocessors: {
			'**/*.html': ['html2js'],
			'**/*.json': ['json_fixtures']
		},
		jsonFixturesPreprocessor: {
			variableName: '__json__',
			// transform the filename 
			transformPath: function(path) {
				return path + '.js';
			}
		}
	});
};

module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		mochaTest: {
			options: {
				timeout: 30000,
				reporter: 'spec',
				ignoreLeaks: true
			},
			src: ['test/**/*.js']
		},
		jshint: {
			options: {
				jshintrc: true
			},
			src: ['lib/**/*.js', 'test/**/*.js']
		},
		kahvesi: {
			src: ['test/**/*.js']
		},
		clean: ['tmp']
	});

	// Load grunt plugins for modules
	// TODO: Uncomment when unit-tests are working
	// grunt.loadNpmTasks('grunt-mocha-test');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-clean');
	// grunt.loadNpmTasks('grunt-kahvesi-latest');

	// register tasks
	// TODO: Uncomment when unit-tests are working
	// grunt.registerTask('cover', ['kahvesi', 'clean']);
	// grunt.registerTask('default', ['jshint', 'mochaTest', 'clean']);
	grunt.registerTask('default', ['jshint', 'clean']);
};

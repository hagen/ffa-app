'use strict';

module.exports = function(grunt) {

	grunt.initConfig({

		dir: {
			src: 'src',
			dist: 'dist'
		},

		openui5_preload: {
			component: {
				options: {
					resources: {
						cwd: '<%= dir.src %>',
						prefix: 'com/ffa/hpc'
					},
					dest: '<%= dir.dist %>'
				},
				components: true
			}
		},

		clean: {
			dist: '<%= dir.dist %>/'
		},

		copy: {
			dist: {
				files: [ {
					expand: true,
					cwd: '<%= dir.src %>',
					src: [
						'**',
						'!test/**'
					],
					dest: '<%= dir.dist %>'
				} ]
			}
		},

    openui5_debug: {
      component: {
        options: {
          resources: {
            cwd: '<%= dir.src %>',
          },
          dest: '<%= dir.dist %>'
        },
        components: true
      }
    },

		eslint: {
			src: ['<%= dir.src %>']
		}

	});

	// These plugins provide necessary tasks.
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-openui5');
	grunt.loadNpmTasks('grunt-eslint');

	// Linting task
	grunt.registerTask('lint', ['eslint']);

	// Build task
	grunt.registerTask('build', ['openui5_preload', 'copy']);

  // Debug tasks
  //grunt.registerTask('debug', ['openui5_debug']);

	// Default task
	grunt.registerTask('default', [
		//'lint',
		'clean',
		'build',
  //  'debug'
	]);
};

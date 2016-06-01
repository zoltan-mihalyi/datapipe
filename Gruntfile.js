module.exports = function(grunt) {

    grunt.initConfig({
        jasmine_nodejs: {
            options: {
                specNameSuffix: '.js'
            },
            test: {
                specs: [
                    "test/**"
                ]
            }
        },
        clean: {
            dist: ['dist']
        },
        ts: {
            compile: {
                tsconfig: '.'
            }
        },
        tslint: {
            options: {
                configuration: 'tslint.json'
            },
            check: {
                src: ['src/**/*.ts']
            }
        }
    });

    grunt.loadNpmTasks('grunt-jasmine-nodejs');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-tslint');

    grunt.registerTask('test', ['jasmine_nodejs']);
    grunt.registerTask('build', ['clean', 'ts']);
};
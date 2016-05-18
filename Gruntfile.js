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
            target: ['target']
        },
        ts: {
            compile: {
                tsconfig: '.'
            }
        }
    });

    grunt.loadNpmTasks('grunt-jasmine-nodejs');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-ts');

    grunt.registerTask('test', ['jasmine_nodejs']);
    grunt.registerTask('build', ['clean', 'ts']);
};
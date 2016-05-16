module.exports = function (grunt) {

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
        }
    });

    grunt.loadNpmTasks('grunt-jasmine-nodejs');

    grunt.registerTask('default', ['jasmine_nodejs']);
};
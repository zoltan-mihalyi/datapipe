var Benchmark = require('benchmark');
Benchmark.options.maxTime = 1;

module.exports = function(grunt) {

    grunt.initConfig({
        jasmine_node: {
            options: {
                showColors: true,
                forceExit: true,
                match: '.',
                matchAll: false,
                specFolders: ['test'],
                extensions: 'js',
                specNameMatcher: '',
                captureExceptions: true
            },
            test: {
                options: {
                    coverage: {
                        report: [],
                        excludes: ['test/**']
                    }
                },
                src: ['**/*.js']
            },
            testFast: {
                options: {
                    coverage: {
                        excludes: ['**']
                    }
                },
                src: ['**/*.js']
            }
        },
        remapIstanbul: {
            build: {
                src: 'coverage/coverage.json',
                options: {
                    reports: {
                        'html': 'coverage/html-report',
                        'json': 'coverage/coverage.json'
                    }
                }
            }
        },
        clean: {
            dist: ['dist'],
            coverage: ['coverage']
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
        },
        benchmark: {
            all: {
                src: ['benchmarks/tests/*.js'],
                dest: 'bench.csv',
                options: {
                    verifyFastest: {
                        fastest: 'undersorcery',
                        exclude: 'native'
                    }
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-tslint');
    grunt.loadNpmTasks('grunt-jasmine-node-coverage');
    grunt.loadNpmTasks('remap-istanbul');
    grunt.loadNpmTasks('grunt-benchmark');

    grunt.registerTask('test-fast', ['jasmine_node:testFast']);
    grunt.registerTask('test', ['clean:coverage', 'jasmine_node:test', 'remapIstanbul']);
    grunt.registerTask('build', ['clean', 'ts']);
};
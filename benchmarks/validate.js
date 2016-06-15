var fs = require('fs');
var path = require('path');

var NO_RESULT = {}; //for reference equality

describe('benchmark tests', function() {
    var dir = 'benchmarks/tests';
    filesRecursive(dir, function(file) {
        var filename = file.substr(dir.length + 1);
        var suites = require(path.resolve(file));
        if (!Array.isArray(suites)) {
            suites = [suites];
        }

        for (var i = 0; i < suites.length; i++) {
            var suite = suites[i];
            validateSuite(filename + ' ' + suite.name, suite)
        }
    });
});

function validateSuite(name, suite) {
    if (suite.name === 'shuffle') {
        return;
    }
    describe(name, function() {
        var firstResult = NO_RESULT;
        for (var i in suite.tests) {
            if (suite.tests.hasOwnProperty(i)) {

                var test = suite.tests[i];
                var result = test();
                if (firstResult === NO_RESULT) {
                    firstResult = result;
                } else {
                    validate(i, firstResult, result);
                }
            }
        }
    });
}

function validate(name, firstResult, result) {
    it(name, function() {
        expect(result).toEqual(firstResult);
    });
}

function filesRecursive(dir, callback) {
    var list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        var stat = fs.statSync(file);
        if (stat.isDirectory()) {
            filesRecursive(file, callback);
        } else {
            callback(file);
        }
    });
}
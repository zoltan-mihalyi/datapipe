var _ = require('underscore');
var __ = require('lodash');
var u = require('../../dist/main');

var array = [2, 6, 2, 1, 1, 5, 3, 3, 1, 6, 4, 1, 4, 3, 5, 1, 4, 2, 2, 6];
var sorted = array.splice().sort();

var _uniq = _.uniq;
var __uniq = __.uniq;

var fn1 = u('array').uniq().fn();

var nativeFn1 = function(array) {
    var result = [];
    var length = array.length;
    for (var i = 0; i < length; ++i) {
        var x = array[i];
        if (result.indexOf(x) === -1) {
            result.push(x);
        }
    }
    return result;
};
var fn2 = u('array').uniq(true).fn();
var nativeFn2 = function(array) {
    var result = [];
    var seen = result;
    var length = array.length;
    for (var i = 0; i < length; ++i) {
        var x = array[i];
        if (x !== seen) {
            result.push(x);
            seen = x;
        }
    }
    return result;
};

module.exports = [{
    name: 'uniq',
    tests: {
        native: function() {
            return nativeFn1(array);
        },
        undersorcery: function() {
            return fn1(array);
        },
        underscore: function() {
            return _uniq(array);
        },
        lodash: function() {
            return __uniq(array);
        }
    }
}, {
    name: 'uniq sorted',
    tests: {
        native: function() {
            return nativeFn2(sorted);
        },
        undersorcery: function() {
            return fn2(sorted);
        },
        underscore: function() {
            return _uniq(sorted, true);
        },
        lodash: function() {
            return __uniq(sorted, true);
        }
    }
}];
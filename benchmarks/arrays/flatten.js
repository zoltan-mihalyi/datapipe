var _ = require('underscore');
var __ = require('lodash');
var u = require('../../dist/main');

var _flatten = _.flatten;
var __flatten = __.flatten;
var __flattenDeep = __.flattenDeep;

var isArray = Array.isArray;

var array = [1, [2, [3, [4]], 5]];

var fn1 = u('array').flatten(true).fn();
var nativeFn1 = function(array) {
    var result = [];
    var length = array.length;
    for (var i = 0; i < length; ++i) {
        var obj = array[i];
        if (obj && isArray(obj)) {
            var length2 = obj.length;
            var offset = result.length;
            for (var j = 0; j < length2; ++j) {
                result[offset + j] = obj[j];
            }
        } else {
            result.push(obj);
        }
    }
    return result;
};

var fn2 = u('array').flatten().fn();
var nativeFn2 = function(array, result) {
    result || (result = []);
    var length = array.length;
    for (var i = 0; i < length; ++i) {
        var obj = array[i];
        if (obj && isArray(obj)) {
            nativeFn2(obj, result);
        } else {
            result.push(obj);
        }
    }
    return result;
};

module.exports = [{
    name: 'flatten shallow',
    tests: {
        native: function() {
            return nativeFn1(array);
        },
        undersorcery: function() {
            return fn1(array);
        },
        underscore: function() {
            return _flatten(array, true);
        },
        lodash: function() {
            return __flatten(array);
        }
    }
}, {
    name: 'flatten deep',
    tests: {
        native: function() {
            return nativeFn2(array);
        },
        undersorcery: function() {
            return fn2(array);
        },
        underscore: function() {
            return _flatten(array);
        },
        lodash: function() {
            return __flattenDeep(array);
        }
    }
}];
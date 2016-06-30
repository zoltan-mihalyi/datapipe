var array = require('../array');
var _ = require('underscore');
var __ = require('lodash');
var dp = require('../../dist/datapipe');

var _last = _.last;
var __last = __.last;
var __takeRight = __.takeRight;

var fn1 = dp('array').last(5).fn();

var nativeFn1 = function(array) {
    var length = array.length;
    var start = 0;
    if (length > 5) {
        length = 5;
        start = length - 5;
    }
    var result = new Array(length);
    for (var i = start; i < length; ++i) {
        result[i - start] = array[i];
    }
    return result;
};

var fn2 = dp('array').last().fn();
var nativeFn2 = function(array) {
    return array[array.length - 1];
};

module.exports = [{
    name: 'last 5',
    tests: {
        native: function() {
            return nativeFn1(array);
        },
        undersorcery: function() {
            return fn1(array);
        },
        underscore: function() {
            return _last(array, 5);
        },
        lodash: function() {
            return __takeRight(array, 5);
        }
    }
}, {
    name: 'last',
    tests: {
        native: function() {
            return nativeFn2(array);
        },
        undersorcery: function() {
            return fn2(array);
        },
        underscore: function() {
            return _last(array);
        },
        lodash: function() {
            return __last(array);
        }
    }
}];
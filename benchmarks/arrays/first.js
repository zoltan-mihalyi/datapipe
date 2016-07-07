var array = require('../array');
var _ = require('underscore');
var __ = require('lodash');
var u = require('../../dist/main');

var _first = _.first;
var __first = __.take;
var __head = __.head;

var fn1 = u('array').first(5).fn();
var nativeFn1 = function(array) {
    var length = array.length;
    if (length > 5) {
        length = 5;
    }
    var result = new Array(length);
    for (var i = 0; i < length; ++i) {
        result[i] = array[i];
    }
    return result;
};

var fn2 = u('array').first().fn();
var nativeFn2 = function(array) {
    return array[0];
};

module.exports = [{
    name: 'first 5',
    tests: {
        native: function() {
            return nativeFn1(array);
        },
        undersorcery: function() {
            return fn1(array);
        },
        underscore: function() {
            return _first(array, 5);
        },
        lodash: function() {
            return __first(array, 5);
        }
    }
}, {
    name: 'first',
    tests: {
        native: function() {
            return nativeFn2(array);
        },
        undersorcery: function() {
            return fn2(array);
        },
        underscore: function() {
            return _first(array);
        },
        lodash: function() {
            return __head(array);
        }
    }
}];
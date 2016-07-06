var array = require('../array');
var _ = require('underscore');
var __ = require('lodash');
var u = require('../../dist/main');

var _take = _.take;
var __take = __.take;
var __head = __.head;

var fn1 = u('array').take(5).fn();
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

var fn2 = u('array').take().fn();
var nativeFn2 = function(array) {
    return array[0];
};

module.exports = [{
    name: 'take 5',
    tests: {
        native: function() {
            return nativeFn1(array);
        },
        undersorcery: function() {
            return fn1(array);
        },
        underscore: function() {
            return _take(array, 5);
        },
        lodash: function() {
            return __take(array, 5);
        }
    }
}, {
    name: 'take first',
    tests: {
        native: function() {
            return nativeFn2(array);
        },
        undersorcery: function() {
            return fn2(array);
        },
        underscore: function() {
            return _take(array);
        },
        lodash: function() {
            return __head(array);
        }
    }
}];
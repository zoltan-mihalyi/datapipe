var array = require('../array');
var _ = require('underscore');
var __ = require('lodash');
var dp = require('../../dist/datapipe');

var _each = _.each;
var __each = __.each;

function each(x) {
}

var context = {};

var fn1 = dp('array').each(each).fn();
var nativeFn1 = function(array) {
    var length = array.length;
    for (var i = 0; i < length; ++i) {
        each(array[i]);
    }
    return array;
};

var fn2 = dp('array').each(each, context).fn();
var nativeFn2 = function(array) {
    var length = array.length;
    for (var i = 0; i < length; ++i) {
        each.call(context, array[i]);
    }
    return array;
};


module.exports = [{
    name: 'each',
    maxTime: 1,
    tests: {
        native: function() {
            return nativeFn1(array);
        },
        undersorcery: function() {
            return fn1(array);
        },
        underscore: function() {
            return _each(array, each);
        },
        lodash: function() {
            return __each(array, each);
        }
    }
}, {
    name: 'each with context',
    maxTime: 1,
    tests: {
        native: function() {
            return nativeFn2(array);
        },
        undersorcery: function() {
            return fn2(array);
        },
        underscore: function() {
            return _each(array, each, context);
        }
    }
}];
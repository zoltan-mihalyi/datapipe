var array = require('../array');
var _ = require('underscore');
var __ = require('lodash');
var u = require('../../dist/main');

var _toArray = _.toArray;
var __toArray = __.toArray;

var map = {
    a: 1,
    b: 2,
    c: 3,
    d: 4
};

var fn1 = u('array').toArray().fn();
var nativeFn1 = function(array) {
    var length = array.length;
    var result = new Array(length);
    for (var i = 0; i < length; ++i) {
        result[i] = array[i]
    }
    return result;
};

var fn2 = u('map').toArray().fn();
var nativeFn2 = function(map) {
    var result = [];
    for (var i in map) {
        //noinspection JSUnfilteredForInLoop
        result.push(map[i]);
    }
    return result;
};

module.exports = [{
    name: 'toArray array',
    tests: {
        native: function() {
            return nativeFn1(array);
        },
        undersorcery: function() {
            return fn1(array);
        },
        underscore: function() {
            return _toArray(array);
        },
        lodash: function() {
            return __toArray(array);
        }
    }
}, {
    name: 'toArray object',
    tests: {
        native: function() {
            return nativeFn2(map);
        },
        undersorcery: function() {
            return fn2(map);
        },
        underscore: function() {
            return _toArray(map);
        },
        lodash: function() {
            return __toArray(map);
        }
    }
}];
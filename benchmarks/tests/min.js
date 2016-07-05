var array = require('../array');
var _ = require('underscore');
var __ = require('lodash');
var u = require('../../dist/main');

var _min = _.min;
var __min = __.min;
var __minBy = __.minBy;

var numberArray = [4, 2, 6, 1, 5, 3];

var fn1 = u('array').min().fn();
var nativeFn1 = function(array) {
    var min = Infinity;
    var length = array.length;
    for (var i = 0; i < length; ++i) {
        var obj = array[i];
        if (obj < min) {
            min = obj;
        }
    }
    return min;
};

var fn2 = u('array').min('x').fn();
var nativeFn2 = function(array) {
    var minValue = Infinity;
    var minObject;
    var length = array.length;
    for (var i = 0; i < length; ++i) {
        var obj = array[i];
        var value = obj.x;
        if (value < minValue) {
            minValue = value;
            minObject = obj;
        }
    }
    return minObject;
};

function getX(obj) {
    return obj.x;
}

var fn3 = u('array').min(getX).fn();
var nativeFn3 = function(array) {
    var minValue = Infinity;
    var minObject;
    var length = array.length;
    for (var i = 0; i < length; ++i) {
        var obj = array[i];
        var value = getX(obj);
        if (value < minValue) {
            minValue = value;
            minObject = obj;
        }
    }
    return minObject;
};

module.exports = [{
    name: 'simple min',
    tests: {
        native: function() {
            return nativeFn1(numberArray);
        },
        undersorcery: function() {
            return fn1(numberArray);
        },
        underscore: function() {
            return _min(numberArray);
        },
        lodash: function() {
            return __min(numberArray);
        }
    }
}, {
    name: 'min by property',
    tests: {
        native: function() {
            return nativeFn2(array);
        },
        undersorcery: function() {
            return fn2(array);
        },
        underscore: function() {
            return _min(array, 'x');
        },
        lodash: function() {
            return __minBy(array, 'x');
        }
    }
}, {
    name: 'min by function',
    tests: {
        native: function() {
            return nativeFn3(array);
        },
        undersorcery: function() {
            return fn3(array);
        },
        underscore: function() {
            return _min(array, getX);
        },
        lodash: function() {
            return __minBy(array, getX);
        }
    }
}];
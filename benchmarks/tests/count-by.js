var array = require('../array');
var _ = require('underscore');
var __ = require('lodash');
var dp = require('../../dist/datapipe');

var _countBy = _.countBy;
var __countBy = __.countBy;

function getX(x) {
    return x.x;
}

var fn1 = dp('array').countBy(getX).fn();
var nativeFn1 = function(array) {
    var result = {};
    var length = array.length;
    for (var i = 0; i < length; ++i) {
        var obj = array[i];
        var key = getX(obj);
        if (result[key]) {
            result[key]++;
        } else {
            result[key] = 1;
        }
    }
    return result;
};

var fn2 = dp('array').countBy('x').fn();
var nativeFn2 = function(array) {
    var result = {};
    var length = array.length;
    for (var i = 0; i < length; ++i) {
        var obj = array[i];
        var key = obj.x;
        if (result[key]) {
            result[key]++;
        } else {
            result[key] = 1;
        }
    }
    return result;
};

module.exports = [{
    name: 'countBy function',
    tests: {
        native: function() {
            return nativeFn1(array);
        },
        undersorcery: function() {
            return fn1(array);
        },
        underscore: function() {
            return _countBy(array, getX);
        },
        lodash: function() {
            return __countBy(array, getX);
        }
    }
},{
    name: 'countBy property',
    tests: {
        native: function() {
            return nativeFn2(array);
        },
        undersorcery: function() {
            return fn2(array);
        },
        underscore: function() {
            return _countBy(array, 'x');
        },
        lodash: function() {
            return __countBy(array, 'x');
        }
    }
}];
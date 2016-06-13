var array = require('../array');
var _ = require('underscore');
var __ = require('lodash');
var dp = require('../../dist/datapipe');

var _pluck = _.pluck;
var __pluck = __.map;

var fn = dp('array').pluck('x').fn();
var nativeFn = function(array) {
    var result = new Array(array.length);
    var length = array.length;
    for (var i = 0; i < length; ++i) {
        var obj = array[i];
        result[i] = obj == null ? obj : obj.x;
    }
    return result;
};

module.exports = {
    name: 'pluck',
    tests: {
        native: function() {
            return nativeFn(array);
        },
        undersorcery: function() {
            return fn(array);
        },
        underscore: function() {
            return _pluck(array, 'x');
        },
        lodash: function() {
            return __pluck(array, 'x');
        }
    }
};
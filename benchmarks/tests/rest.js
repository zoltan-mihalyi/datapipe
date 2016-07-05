var array = require('../array');
var _ = require('underscore');
var __ = require('lodash');
var u = require('../../dist/main');

var _rest = _.rest;
var __rest = __.drop;


var fn = u('array').rest(3).fn();
var nativeFn = function(array) {
    var length = array.length;
    var result = new Array(length <= 3 ? 0 : length - 3);
    for (var i = 3; i < length; ++i) {
        result[i - 3] = array[i];
    }
    return result;
};

module.exports = {
    name: 'map',
    tests: {
        native: function() {
            return nativeFn(array);
        },
        undersorcery: function() {
            return fn(array);
        },
        underscore: function() {
            return _rest(array, 3);
        },
        lodash: function() {
            return __rest(array, 3);
        }
    }
};
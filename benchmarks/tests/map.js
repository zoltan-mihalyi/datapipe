var array = require('../array');
var _ = require('underscore');
var __ = require('lodash');
var u = require('../../dist/main');

var _map = _.map;
var __map = __.map;

function map(x, i) {
    return x.x + i;
}

var fn = u('array').map(map).fn();
var nativeFn = function(array) {
    var result = new Array(array.length);
    var length = array.length;
    for (var i = 0; i < length; ++i) {
        result[i] = map(array[i], i);
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
            return _map(array, map);
        },
        lodash: function() {
            return __map(array, map);
        }
    }
};
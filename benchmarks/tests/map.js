var array = require('../array');
var _ = require('underscore');
var __ = require('lodash');
var dp = require('../../dist/datapipe');

function map(x, i) {
    return x.x + i;
}

var wrapper = {
    fn: dp('array').map(map).fn(),
    nativeFn: function(array) {
        var result = new Array(array.length);
        var length = array.length;
        for (var i = 0; i < length; ++i) {
            result[i] = map(array[i], i);
        }
        return result;
    }
};

module.exports = {
    name: 'map',
    tests: {
        native: function() {
            return wrapper.nativeFn(array);
        },
        undersorcery: function() {
            return wrapper.fn(array);
        },
        underscore: function() {
            return _.map(array, map);
        },
        lodash: function() {
            return __.map(array, map);
        }
    }
};
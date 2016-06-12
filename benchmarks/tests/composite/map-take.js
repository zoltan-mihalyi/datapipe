var array = require('../../array');
var _ = require('underscore');
var __ = require('lodash');
var dp = require('../../../dist/datapipe');

function map(x, i) {
    return x.x + i;
}

var wrapper = {
    fn: dp('array').map(map).take(3).fn(),
    nativeFn: function(array) {
        var length = array.length;
        if (length > 3) {
            length = 3;
        }
        var result = new Array(length);
        for (var i = 0; i < length; ++i) {
            result[i] = map(array[i], i);
        }
        return result;
    }
};

module.exports = {
    name: 'map and take',
    tests: {
        native: function() {
            return wrapper.nativeFn(array);
        },
        undersorcery: function() {
            return wrapper.fn(array);
        },
        underscore: function() {
            return _.take(_.map(array, map), 3);
        },
        lodash: function() {
            return __.take(__.map(array, map), 3);
        }
    }
};
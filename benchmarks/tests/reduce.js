var array = require('../array');
var _ = require('underscore');
var __ = require('lodash');
var dp = require('../../dist/datapipe');

var _reduce = _.reduce;
var __reduce = __.reduce;

function reducer(memo, x) {
    x = x.x;
    if (x) {
        return memo + x;
    } else {
        return memo;
    }
}

var fn = dp('array').reduce(reducer, 0).fn();
var nativeFn = function(array) {
    var memo = 0;
    var length = array.length;
    for (var i = 0; i < length; i++) {
        memo = reducer(memo, array[i]);
    }
    return memo;
};

module.exports = {
    name: 'reduce',
    tests: {
        native: function() {
            return nativeFn(array);
        },
        undersorcery: function() {
            return fn(array);
        },
        underscore: function() {
            return _reduce(array, reducer, 0);
        },
        lodash: function() {
            return __reduce(array, reducer, 0);
        }
    }
};
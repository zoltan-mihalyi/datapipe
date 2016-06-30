var _ = require('underscore');
var __ = require('lodash');
var dp = require('../../dist/datapipe');

var array = [1, 2, 3, 4, 5, 6];

var _without = _.without;
var __without = __.without;

var fn = dp('array').without(1, 3, 5).fn();
var nativeFn = function(array) {
    var length = array.length;
    var result = [];
    for (var i = 0; i < length; ++i) {
        var x = array[i];
        if (x !== 1 && x !== 3 && x !== 5) {
            result.push(x);
        }
    }
    return result;
};

module.exports = {
    name: 'without',
    tests: {
        native: function() {
            return nativeFn(array);
        },
        undersorcery: function() {
            return fn(array);
        },
        underscore: function() {
            return _without(array, 1, 3, 5);
        },
        lodash: function() {
            return __without(array, 1, 3, 5);
        }
    }
};
var _ = require('underscore');
var __ = require('lodash');
var u = require('../../dist/main');

var array = [1, 2, 3, 4, 5, 6];
var diff = [2, 4, 6];

var _difference = _.difference;
var __difference = __.difference;


var fn = u('array').difference(diff).fn();

var nativeFn = function(array) {
    var length = array.length;
    var result = [];
    for (var i = 0; i < length; ++i) {
        var x = array[i];
        if (x !== 2 && x !== 4 && x !== 6) {
            result.push(x);
        }
    }
    return result;
};

module.exports = {
    name: 'difference',
    tests: {
        native: function() {
            return nativeFn(array);
        },
        undersorcery: function() {
            return fn(array);
        },
        underscore: function() {
            return _difference(array, diff);
        },
        lodash: function() {
            return __difference(array, diff);
        }
    }
};
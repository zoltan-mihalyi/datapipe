var _ = require('underscore');
var __ = require('lodash');
var u = require('../../dist/main');

var _intersection = _.intersection;
var __intersection = __.intersection;

var array = [0, 1, 1, 2, 3, 2, 3, 4, 5, 6];
var intersection1 = [1, 3, 5, 7];
var intersection2 = [1, 2, 3, 4];

var fn = u('array').intersection(intersection1, intersection2).fn();

var nativeFn = function(array) {
    var result = [];
    var length = array.length;
    for (var i = 0; i < length; ++i) {
        var obj = array[i];
        if (result.indexOf(obj) === -1) {
            if (obj !== 1 && obj !== 3) {
                continue;
            }
            result.push(obj);
        }
    }
    return result;
};

module.exports = {
    name: 'intersection',
    tests: {
        native: function() {
            return nativeFn(array);
        },
        undersorcery: function() {
            return fn(array);
        },
        underscore: function() {
            return _intersection(array, intersection1, intersection2);
        },
        lodash: function() {
            return __intersection(array, intersection1, intersection2);
        }
    }
};
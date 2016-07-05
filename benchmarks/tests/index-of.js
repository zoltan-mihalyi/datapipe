var array = require('../array');
var _ = require('underscore');
var __ = require('lodash');
var dp = require('../../dist/datapipe');

var _indexOf = _.indexOf;
var __indexOf = __.indexOf;
var __sortedIndexOf = __.sortedIndexOf;

var item = array[3];

var array2 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28];

var fn1 = dp('array').indexOf(item).fn();
var nativeFn1 = function(array) {
    var length = array.length;
    for (var i = 0; i < length; ++i) {
        if (array[i] === item) {
            return i;
        }
    }
    return -1;
};

var fn2 = dp('array').indexOf(15, true).fn();

var nativeFn2 = function(array) {
    var start = 0;
    var end = array.length - 1;

    while (start <= end) {
        var i = (start + end) / 2 | 0;
        var x = array[i];

        if (x < 15) {
            start = i + 1;
        }
        else if (x > 15) {
            end = i - 1;
        }
        else {
            return i;
        }
    }
    return -1;
};

module.exports = [{
    name: 'indexOf',
    tests: {
        native: function() {
            return nativeFn1(array);
        },
        undersorcery: function() {
            return fn1(array);
        },
        underscore: function() {
            return _indexOf(array, item);
        },
        lodash: function() {
            return __indexOf(array, item);
        }
    }
}, {
    name: 'indexOf sorted',
    tests: {
        native: function() {
            return nativeFn2(array2);
        },
        undersorcery: function() {
            return fn2(array2);
        },
        underscore: function() {
            return _indexOf(array2, 15, true);
        },
        lodash: function() {
            return __sortedIndexOf(array2, 15);
        }
    }
}];
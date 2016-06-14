var array = require('../array');
var _ = require('underscore');
var __ = require('lodash');
var dp = require('../../dist/datapipe');

var _sortBy = _.sortBy;
var __sortBy = __.sortBy;

var numberArray = [4, 2, 6, 1, 5, 3];

var fn1 = dp('array').sortBy().fn();
var nativeFn1 = function(array) {
    var length = array.length;
    var result = new Array(length);
    for (var i = 0; i < length; ++i) {
        result[i] = array[i];
    }
    return result.sort();
};


function rank(x) {
    return x.x;
}

var fn2 = dp('array').sortBy(rank).fn();
var nativeFn2 = function(array) {
    var length = array.length;
    var result = new Array(length);
    for (var i = 0; i < length; ++i) {
        result[i] = array[i];
    }
    return result.sort(function(a, b) {
        return rank(a) - rank(b);
    });
};


module.exports = [{
    name: 'sortBy without comparator',
    tests: {
        native: function() {
            return nativeFn1(numberArray);
        },
        undersorcery: function() {
            return fn1(numberArray);
        },
        underscore: function() {
            return _sortBy(numberArray);
        },
        lodash: function() {
            return __sortBy(numberArray);
        }
    }
}, {
    name: 'sortBy with comparator',
    tests: {
        native: function() {
            return nativeFn2(array);
        },
        undersorcery: function() {
            return fn2(array);
        },
        underscore: function() {
            return _sortBy(array, rank);
        },
        lodash: function() {
            return __sortBy(array, rank);
        }
    }
}];
var _ = require('underscore');
var __ = require('lodash');
var u = require('../../dist/main');

var array = [1, 2, 3];
var union1 = [1, 3];
var union2 = [2, 4, 5];
var union3 = [3, 5, 6];

var _union = _.union;
var __union = __.union;


var fn = u('array').union(union1, union2, union3).fn();
var nativeFn = function(array) {
    var length = array.length;
    var result = new Array(length);
    for (var i = 0; i < length; ++i) {
        result[i] = array[i];
    }

    if (result.indexOf(1) === -1) {
        result.push(1);
    }
    if (result.indexOf(3) === -1) {
        result.push(3);
    }
    if (result.indexOf(2) === -1) {
        result.push(2);
    }
    if (result.indexOf(4) === -1) {
        result.push(4);
    }
    if (result.indexOf(5) === -1) {
        result.push(5);
    }
    if (result.indexOf(6) === -1) {
        result.push(6);
    }

    return result;
};

module.exports = {
    name: 'union',
    tests: {
        native: function() {
            return nativeFn(array);
        },
        undersorcery: function() {
            return fn(array);
        },
        underscore: function() {
            return _union(array, union1, union2, union3);
        },
        lodash: function() {
            return __union(array, union1, union2, union3);
        }
    }
};
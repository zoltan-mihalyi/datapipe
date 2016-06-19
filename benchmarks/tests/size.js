var array = require('../array');
var _ = require('underscore');
var __ = require('lodash');
var dp = require('../../dist/datapipe');

var _size = _.size;
var __size = __.size;

var obj = {
    a: 1,
    b: 2,
    c: 3,
    d: 4
};

var fn1 = dp('array').size().fn();
var nativeFn1 = function(array) {
    return array.length
};
var fn2 = dp('map').size().fn();
var nativeFn2 = function(obj) {
    var result = 0;
    for (var i in obj) {
        ++result;
    }
    return result;
};

module.exports = [{
    name: 'size array',
    tests: {
        native: function() {
            return nativeFn1(array);
        },
        undersorcery: function() {
            return fn1(array);
        },
        underscore: function() {
            return _size(array);
        },
        lodash: function() {
            return __size(array);
        }
    }
}, {
    name: 'size object',
    tests: {
        native: function() {
            return nativeFn2(obj);
        },
        undersorcery: function() {
            return fn2(obj);
        },
        underscore: function() {
            return _size(obj);
        },
        lodash: function() {
            return __size(obj);
        }
    }
}];
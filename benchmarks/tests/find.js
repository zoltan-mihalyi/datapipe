var array = require('../array');
var _ = require('underscore');
var __ = require('lodash');
var dp = require('../../dist/datapipe');

var _find = _.find;
var __find = __.find;

function predicate(x) {
    return x.a === 1;
}

var fn = dp('array').find(predicate).fn();
var nativeFn = function(array) {
    var length = array.length;
    for (var i = 0; i < length; ++i) {
        var obj = array[i];
        if (predicate(obj)) {
            return obj;
        }
    }
};

module.exports = {
    name: 'find',
    tests: {
        native: function() {
            return nativeFn(array);
        },
        undersorcery: function() {
            return fn(array);
        },
        underscore: function() {
            return _find(array, predicate);
        },
        lodash: function() {
            return __find(array, predicate);
        }
    }
};
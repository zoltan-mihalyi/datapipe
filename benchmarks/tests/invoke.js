var array = require('../array');
var _ = require('underscore');
var __ = require('lodash');
var dp = require('../../dist/datapipe');

var _invoke = _.invoke;
var __invoke = __.invoke;

var fn = dp('array').invoke('toString').fn();
var nativeFn = function(array) {
    var length = array.length;
    var result = new Array(length);
    for (var i = 0; i < length; i++) {
        result[i] = array[i].toString();
    }
    return result;
};

module.exports = {
    name: 'invoke',
    tests: {
        native: function() {
            return nativeFn(array)
        },
        undersorcery: function() {
            return fn(array);
        },
        underscore: function() {
            return _invoke(array, 'toString');
        },
        lodash: function() {
            return __invoke(array, 'toString');
        }
    }
};

var array = require('../array');
var _ = require('underscore');
var __ = require('lodash');
var dp = require('../../dist/datapipe');

var _take = _.take;
var __take = __.take;

var fn = dp('array').take(5).fn();
var nativeFn = function(array) {
    var length = array.length;
    if (length > 5) {
        length = 5;
    }
    var result = new Array(length);
    for (var i = 0; i < length; i++) {
        result[i] = array[i];
    }
    return result;
};

module.exports = {
    name: 'take 5',
    tests: {
        native: function() {
            return nativeFn(array);
        },
        undersorcery: function() {
            return fn(array);
        },
        underscore: function() {
            return _take(array, 5);
        },
        lodash: function() {
            return __take(array, 5);
        }
    }
};
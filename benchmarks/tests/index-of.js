var array = require('../array');
var _ = require('underscore');
var __ = require('lodash');
var dp = require('../../dist/datapipe');

var _indexOf = _.indexOf;
var __indexOf = __.indexOf;

var item = array[3];

var fn = dp('array').indexOf(item).fn();
var nativeFn = function(array) {
    var length = array.length;
    for (var i = 0; i < length; ++i) {
        if (array[i] === item) {
            return i;
        }
    }
    return -1;
};

module.exports = {
    name: 'indexOf',
    tests: {
        native: function() {
            return nativeFn(array);
        },
        undersorcery: function() {
            return fn(array);
        },
        underscore: function() {
            return _indexOf(array, item);
        },
        lodash: function() {
            return __indexOf(array, item);
        }
    }
};
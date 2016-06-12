var array = require('../array');
var _ = require('underscore');
var __ = require('lodash');
var dp = require('../../dist/datapipe');

var _findWhere = _.findWhere;
var __findWhere = __.find;

var filter = {a: 1};

var fn = dp('array').findWhere(filter).fn();
var nativeFn = function(array) {
    var length = array.length;
    for (var i = 0; i < length; ++i) {
        var obj = array[i];
        if (obj.a === 1) {
            return obj;
        }
    }
};

module.exports = {
    name: 'findWhere',
    tests: {
        native: function() {
            return nativeFn(array);
        },
        undersorcery: function() {
            return fn(array);
        },
        underscore: function() {
            return _findWhere(array, filter);
        },
        lodash: function() {
            return __findWhere(array, filter);
        }
    }
};
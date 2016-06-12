var array = require('../array');
var _ = require('underscore');
var __ = require('lodash');
var dp = require('../../dist/datapipe');

var _where = _.where;
var __filter = __.filter;

var filter = {x: 1, y: 2};
var fn = dp('array').where(filter).fn();
var nativeFn = function(array) {
    var result = [];
    var length = array.length;
    for (var i = 0; i < length; ++i) {
        var obj = array[i];
        if (obj.x === 1 && obj.y === 2) {
            result.push(obj);
        }
    }
    return result;
};

module.exports = {
    name: 'properties filter',
    tests: {
        native: function() {
            return nativeFn(array);
        },
        undersorcery: function() {
            return fn(array);
        },
        underscore: function() {
            return _where(array, filter);
        },
        lodash: function() {
            return __filter(array, filter);
        }
    }
};
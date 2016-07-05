var array = require('../array');
var _ = require('underscore');
var __ = require('lodash');
var u = require('../../dist/main');

var _contains = _.contains;
var __contains = __.includes;

var obj = array[3];

var fn = u('array').contains(obj).fn();
var nativeFn = function(array) {
    var length = array.length;
    for (var i = 0; i < length; ++i) {
        if (array[i] === obj) {
            return true;
        }
    }
    return false;
};

module.exports = {
    name: 'contains',
    tests: {
        native: function() {
            return nativeFn(array);
        },
        undersorcery: function() {
            return fn(array);
        },
        underscore: function() {
            return _contains(array, obj);
        },
        lodash: function() {
            return __contains(array, obj);
        }
    }
};
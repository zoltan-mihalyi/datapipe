var array = require('../../array');
var _ = require('underscore');
var __ = require('lodash');
var dp = require('../../../dist/datapipe');

var _map = _.map;
var __map = __.map;

var _filter = _.filter;
var __filter = __.filter;

var _chain = _.chain;
var __chain = __.chain;

function map(x, i) {
    return x.x + i;
}

function filter(x, i) {
    return x % i === 0;
}

var fn = dp('array').map(map).filter(filter).fn();
var nativeFn = function(array) {
    var result = [];
    var length = array.length;
    for (var i = 0; i < length; i++) {
        var obj = map(array[i], i);
        if (filter(obj, i)) {
            result.push(obj);
        }
    }
    return result;
};

module.exports = {
    name: 'map and filter',
    tests: {
        native: function() {
            return nativeFn(array);
        },
        undersorcery: function() {
            return fn(array);
        },
        underscore: function() {
            return _filter(_map(array, map), filter);
        },
        lodash: function() {
            return __filter(__map(array, map), filter);
        },
        'underscore chaining': function() {
            return _chain(array).map(map).filter(filter).value();
        },
        'lodash chaining': function() {
            return __chain(array).map(map).filter(filter).value();
        }
    }
};

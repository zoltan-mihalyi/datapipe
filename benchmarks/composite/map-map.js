var array = require('../array');
var _ = require('underscore');
var __ = require('lodash');
var u = require('../../dist/main');

var _map = _.map;
var __map = __.map;

var _chain = _.chain;
var __chain = __.chain;

function map1(x, i) {
    return x.x + i;
}
function map2(x) {
    return x + 1;
}
var fn = u('array').map(map1).map(map2).fn();
var nativeFn = function(array) {
    var result = new Array(array.length);
    var length = array.length;
    for (var i = 0; i < length; ++i) {
        result[i] = map2(map1(array[i], i));
    }
    return result;
};


module.exports = {
    name: 'map two times',
    tests: {
        native: function() {
            return nativeFn(array);
        },
        undersorcery: function() {
            return fn(array);
        },
        underscore: function() {
            return _map(_map(array, map1), map2);
        },
        lodash: function() {
            return __map(__map(array, map1), map2);
        },
        'underscore chaining': function() {
            return _chain(array).map(map1).map(map2).value();
        },
        'lodash chaining': function() {
            return __chain(array).map(map1).map(map2).value();
        }
    }
};
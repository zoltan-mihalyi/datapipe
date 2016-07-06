var array = require('../array');
var _ = require('underscore');
var __ = require('lodash');
var u = require('../../dist/main');

var _partition = _.partition;
var __partition = __.partition;

function predicate(x) {
    return x.x % 2 === 0;
}

var fn = u('array').partition(predicate).fn();
var nativeFn = function(array) {
    var part1 = [];
    var part2 = [];
    var length = array.length;
    for (var i = 0; i < length; ++i) {
        var x = array[i];
        if (predicate(x)) {
            part1.push(x);
        } else {
            part2.push(x);
        }
    }
    return [part1, part2];
};

module.exports = {
    name: 'partition',
    tests: {
        native: function() {
            return nativeFn(array);
        },
        undersorcery: function() {
            return fn(array);
        },
        underscore: function() {
            return _partition(array, predicate);
        },
        lodash: function() {
            return __partition(array, predicate);
        }
    }
};
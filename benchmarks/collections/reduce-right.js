var array = require('../array');
var _ = require('underscore');
var __ = require('lodash');
var u = require('../../dist/main');

var _reduceRight = _.reduceRight;
var __reduceRight = __.reduceRight;

function reducer(memo, x) {
    x = x.x;
    if (x) {
        return memo + x;
    } else {
        return memo;
    }
}

var fn = u('array').reduceRight(reducer, 0).fn();
var nativeFn = function(array) {
    var memo = 0;
    for (var i = array.length - 1; i >= 0; --i) {
        memo = reducer(memo, array[i]);
    }
    return memo;
};

module.exports = {
    name: 'reduceRight',
    tests: {
        native: function() {
            return nativeFn(array);
        },
        undersorcery: function() {
            return fn(array);
        },
        underscore: function() {
            return _reduceRight(array, reducer, 0);
        },
        lodash: function() {
            return __reduceRight(array, reducer, 0);
        }
    }
};
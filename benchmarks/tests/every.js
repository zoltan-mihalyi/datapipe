var array = require('../array');
var _ = require('underscore');
var __ = require('lodash');
var u = require('../../dist/main');

var _every = _.every;
var __every = __.every;

function predicate(x) {
    return x.x >= 0;
}
var fn1 = u('array').every(predicate).fn();
var nativeFn1 = function(array) {
    var length = array.length;
    for (var i = 0; i < length; ++i) {
        if (!(array[i].x >= 0)) {
            return false;
        }
    }
    return true;
};

//noinspection JSUnusedLocalSymbols
function predicate2(x, i) {
    return i !== 3;
}


var fn2 = u('array').every(predicate2).fn();
var nativeFn2 = function(array) {
    var length = array.length;
    for (var i = 0; i < length; ++i) {
        if (i === 3) {
            return false;
        }
    }
    return true;
};

module.exports = [{
    name: 'every until end',
    tests: {
        native: function() {
            return nativeFn1(array);
        },
        undersorcery: function() {
            return fn1(array);
        },
        underscore: function() {
            return _every(array, predicate);
        },
        lodash: function() {
            return __every(array, predicate);
        }
    }
}, {
    name: 'every to half',
    tests: {
        native: function() {
            return nativeFn2(array);
        },
        undersorcery: function() {
            return fn2(array);
        },
        underscore: function() {
            return _every(array, predicate2);
        },
        lodash: function() {
            return __every(array, predicate2);
        }
    }
}];
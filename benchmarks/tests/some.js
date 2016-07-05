var array = require('../array');
var _ = require('underscore');
var __ = require('lodash');
var u = require('../../dist/main');

var _some = _.some;
var __some = __.some;

function predicate(x) {
    return x.x < 0;
}
var fn1 = u('array').some(predicate).fn();
var nativeFn1 = function(array) {
    var length = array.length;
    for (var i = 0; i < length; ++i) {
        if (array[i].x < 0) {
            return true;
        }
    }
    return false;
};

//noinspection JSUnusedLocalSymbols
function predicate2(x, i) {
    return i === 3;
}


var fn2 = u('array').some(predicate2).fn();
var nativeFn2 = function(array) {
    var length = array.length;
    for (var i = 0; i < length; ++i) {
        if (i === 3) {
            return true;
        }
    }
    return false;
};

module.exports = [{
    name: 'some until end',
    tests: {
        native: function() {
            return nativeFn1(array);
        },
        undersorcery: function() {
            return fn1(array);
        },
        underscore: function() {
            return _some(array, predicate);
        },
        lodash: function() {
            return __some(array, predicate);
        }
    }
}, {
    name: 'some to half',
    tests: {
        native: function() {
            return nativeFn2(array);
        },
        undersorcery: function() {
            return fn2(array);
        },
        underscore: function() {
            return _some(array, predicate2);
        },
        lodash: function() {
            return __some(array, predicate2);
        }
    }
}];
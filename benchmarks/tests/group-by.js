var array = require('../array');
var _ = require('underscore');
var __ = require('lodash');
var dp = require('../../dist/datapipe');

var _groupBy = _.groupBy;
var __groupBy = __.groupBy;

function getX(x) {
    return x.x;
}

var fn1 = dp('array').groupBy(getX).fn();
var nativeFn1 = function(array) {
    var result = {};
    var length = array.length;
    for (var i = 0; i < length; ++i) {
        var obj = array[i];
        var key = getX(obj);
        if (result[key]) {
            result[key].push(obj);
        } else {
            result[key] = [obj];
        }
    }
    return result;
};


var fn2 = dp('array').groupBy('x').fn();
var nativeFn2 = function(array) {
    var result = {};
    var length = array.length;
    for (var i = 0; i < length; ++i) {
        var obj = array[i];
        var key = obj.x;
        if (result[key]) {
            result[key].push(obj);
        } else {
            result[key] = [obj];
        }
    }
    return result;
};

module.exports = [{
    name: 'groupBy function',
    tests: {
        native: function() {
            return nativeFn1(array);
        },
        undersorcery: function() {
            return fn1(array);
        },
        underscore: function() {
            return _groupBy(array, getX);
        },
        lodash: function() {
            return __groupBy(array, getX);
        }
    }
},{
    name: 'groupBy property',
    tests: {
        native: function() {
            return nativeFn2(array);
        },
        undersorcery: function() {
            return fn2(array);
        },
        underscore: function() {
            return _groupBy(array, 'x');
        },
        lodash: function() {
            return __groupBy(array, 'x');
        }
    }
}];
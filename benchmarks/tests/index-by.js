var array = require('../array');
var _ = require('underscore');
var __ = require('lodash');
var dp = require('../../dist/datapipe');

var _indexBy = _.indexBy;
var __keyBy = __.keyBy;

function index(x) {
    return x.x;
}

var fn1 = dp('array').indexBy(index).fn();
var nativeFn1 = function(array) {
    var result = {};
    var length = array.length;
    for (var i = 0; i < length; i++) {
        var obj = array[i];
        result[index(obj)] = obj;
    }
    return result;
};
var indexName = 'x';

var fn2 = dp('array').indexBy(indexName).fn();
var nativeFn2 = function(array) {
    var result = {};
    var length = array.length;
    for (var i = 0; i < length; i++) {
        var obj = array[i];
        result[obj.x] = obj;
    }
    return result;
};

module.exports = [{
    name: 'indexBy function',
    tests: {
        native: function() {
            return nativeFn1(array);
        },
        undersorcery: function() {
            return fn1(array);
        },
        underscore: function() {
            return _indexBy(array, index);
        },
        lodash: function() {
            return __keyBy(array, index);
        }
    }
}, {
    name: 'indexBy property name',
    tests: {
        native: function() {
            return nativeFn2(array);
        },
        undersorcery: function() {
            return fn2(array);
        },
        underscore: function() {
            return _indexBy(array, indexName);
        },
        lodash: function() {
            return __keyBy(array, indexName);
        }
    }
}];
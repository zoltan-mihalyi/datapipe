var array = require('../array');
var _ = require('underscore');
var __ = require('lodash');
var dp = require('../../dist/datapipe');

function index(x) {
    return x.x;
}

var wrapper1 = {
    fn: dp('array').indexBy(index).fn(),
    nativeFn: function(array) {
        var result = {};
        for (var i = 0; i < array.length; i++) {
            var obj = array[i];
            result[index(obj)] = obj;
        }
        return result;
    }
};

var indexName = 'x';
var wrapper2 = {
    fn: dp('array').indexBy(indexName).fn(),
    nativeFn: function(array) {
        var result = {};
        for (var i = 0; i < array.length; i++) {
            var obj = array[i];
            result[obj.x] = obj;
        }
        return result;
    }
};

module.exports = [{
    name: 'indexBy function',
    tests: {
        native: function() {
            return wrapper1.nativeFn(array);
        },
        undersorcery: function() {
            return wrapper1.fn(array);
        },
        underscore: function() {
            return _.indexBy(array, index);
        },
        lodash: function() {
            return __.keyBy(array, index);
        }
    }
}, {
    name: 'indexBy property name',
    tests: {
        native: function() {
            return wrapper2.nativeFn(array);
        },
        undersorcery: function() {
            return wrapper2.fn(array);
        },
        underscore: function() {
            return _.indexBy(array, indexName);
        },
        lodash: function() {
            return __.keyBy(array, indexName);
        }
    }
}];
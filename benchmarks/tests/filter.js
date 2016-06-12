var array = require('../array');
var _ = require('underscore');
var __ = require('lodash');
var dp = require('../../dist/datapipe');

var _filter = _.filter;
var __filter = __.filter;

function filter(x) {
    return x.x === 1;
}

var fn1 = dp('array').filter(filter).fn();
var nativeFn1 = function(array) {
    var result = [];
    var length = array.length;
    for (var i = 0; i < length; ++i) {
        var obj = array[i];
        if (obj.x === 1) {
            result.push(obj);
        }
    }
    return result;
};

function filter2(x, i) {
    return i % 2 === 0;
}
var fn2 = dp('array').filter(filter2).fn();
var nativeFn2 = function(array) {
    var result = [];
    var length = array.length;
    for (var i = 0; i < length; ++i) {
        if (i % 2 === 0) {
            result.push(array[i]);
        }
    }
    return result;
};

var context = {
    modulo: 0
};

function filter3(x, i) {
    return i % 2 === this.modulo;
}
var fn3 = dp('array').filter(filter3, context).fn();
var nativeFn3 = function(array) {
    var result = [];
    var length = array.length;
    for (var i = 0; i < length; ++i) {
        var obj = array[i];
        if (filter3.call(context, obj, i)) {
            result.push(obj);
        }
    }
    return result;
};

module.exports = [{
    name: 'filter without index',
    tests: {
        native: function() {
            return nativeFn1(array);
        },
        undersorcery: function() {
            return fn1(array);
        },
        underscore: function() {
            return _filter(array, filter);
        },
        lodash: function() {
            return __filter(array, filter);
        }
    }
}, {
    name: 'filter with index',
    tests: {
        native: function() {
            return nativeFn2(array);
        },
        undersorcery: function() {
            return fn2(array);
        },
        underscore: function() {
            return _filter(array, filter2);
        },
        lodash: function() {
            return __filter(array, filter2);
        }
    }
}, {
    name: 'filter with context',
    tests: {
        native: function() {
            return nativeFn3(array);
        },
        undersorcery: function() {
            return fn3(array);
        },
        underscore: function() {
            return _filter(array, filter3, context);
        }
    }
}];
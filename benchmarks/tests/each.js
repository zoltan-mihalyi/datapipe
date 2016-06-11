var array = require('../array');
var _ = require('underscore');
var __ = require('lodash');
var dp = require('../../dist/datapipe');

function each(x) {
}

var context = {};
var wrapper1 = {
    fn: dp('array').each(each).fn(),
    nativeFn: function(array) {
        for (var i = 0; i < array.length; i++) {
            each(array[i]);
        }
        return array;
    }
};
var wrapper2 = {
    fn: dp('array').each(each, context).fn(),
    nativeFn: function(array) {
        for (var i = 0; i < array.length; i++) {
            each.call(context, array[i]);
        }
        return array;
    }
};


module.exports = [{
    name: 'each',
    maxTime: 1,
    tests: {
        native: function() {
            return wrapper1.nativeFn(array);
        },
        undersorcery: function() {
            return wrapper1.fn(array);
        },
        underscore: function() {
            return _.each(array, each);
        },
        lodash: function() {
            return __.each(array, each);
        }
    }
}, {
    name: 'each with context',
    maxTime: 1,
    tests: {
        native: function() {
            return wrapper2.nativeFn(array);
        },
        undersorcery: function() {
            return wrapper2.fn(array);
        },
        underscore: function() {
            return _.each(array, each, context);
        }
    }
}];
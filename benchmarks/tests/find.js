var array = require('../array');
var _ = require('underscore');
var __ = require('lodash');
var dp = require('../../dist/datapipe');

function predicate(x) {
    return x.a === 1;
}

var wrapper = {
    fn: dp('array').find(predicate).fn(),
    nativeFn: function(array) {
        var length = array.length;
        for (var i = 0; i < length; i++) {
            var obj = array[i];
            if (predicate(obj)) {
                return obj;
            }
        }
    }
};

module.exports = {
    name: 'find',
    tests: {
        native: function() {
            return wrapper.nativeFn(array);
        },
        undersorcery: function() {
            return wrapper.fn(array);
        },
        underscore: function() {
            return _.find(array, predicate);
        },
        lodash: function() {
            return __.find(array, predicate);
        }
    }
};
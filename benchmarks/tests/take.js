var array = require('../array');
var _ = require('underscore');
var __ = require('lodash');
var dp = require('../../dist/datapipe');

var wrapper = {
    fn: dp('array').take(5).fn(),
    nativeFn: function(array) {
        var length = array.length;
        if (length > 5) {
            length = 5;
        }
        var result = new Array(length);
        for (var i = 0; i < length; i++) {
            result[i] = array[i];
        }
        return result;
    }
};

module.exports = {
    name: 'take 5',
    tests: {
        native: function() {
            return wrapper.nativeFn(array);
        },
        undersorcery: function() {
            return wrapper.fn(array);
        },
        underscore: function() {
            return _.take(array, 5);
        },
        lodash: function() {
            return __.take(array, 5);
        }
    }
};
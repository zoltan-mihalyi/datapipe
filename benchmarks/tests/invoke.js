var array = require('../array');
var _ = require('underscore');
var __ = require('lodash');
var dp = require('../../dist/datapipe');

var wrapper = {
    fn: dp('array').invoke('toString').fn(),
    nativeFn: function(array) {
        var length = array.length;
        var result = new Array(length);
        for (var i = 0; i < length; i++) {
            result[i] = array[i].toString();
        }
        return result;
    }
};

module.exports = {
    name: 'invoke',
    tests: {
        native: function() {
            return wrapper.nativeFn(array)
        },
        undersorcery: function() {
            return wrapper.fn(array);
        },
        underscore: function() {
            return _.invoke(array, 'toString');
        },
        lodash: function() {
            return __.invoke(array, 'toString');
        }
    }
};

var array = require('../array');
var _ = require('underscore');
var __ = require('lodash');
var dp = require('../../dist/datapipe');

var _shuffle = _.shuffle;
var __shuffle = __.shuffle;

var fn = dp('array').shuffle().fn();


var nativeFn = function(array) {
    var length = array.length;
    var result = new Array(length);
    for (var i = 0; i < length; ++i) {
        var random = Math.floor(Math.random() * (i + 1));
        if (random !== i) {
            result[i] = result[random];
        }
        result[random] = array[i];
    }
    return result;
};

module.exports = {
    name: 'shuffle',
    tests: {
        native: function() {
            return nativeFn(array);
        },
        undersorcery: function() {
            return fn(array);
        },
        underscore: function() {
            return _shuffle(array);
        },
        lodash: function() {
            return __shuffle(array);
        }
    }
};
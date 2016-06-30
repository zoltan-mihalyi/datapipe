var array = require('../array');
var _ = require('underscore');
var __ = require('lodash');
var dp = require('../../dist/datapipe');

var _initial = _.initial;
var __initial = __.dropRight;

var fn = dp('array').initial(5).fn();

var nativeFn = function(array) {
    var length = array.length;
    length = length > 5 ? length - 5 : 0;
    var result = new Array(length);
    for (var i = 0; i < length; ++i) {
        result[i] = array[i];
    }
    return result;
};

module.exports = [{
    name: 'initial 5',
    tests: {
        native: function() {
            return nativeFn(array);
        },
        undersorcery: function() {
            return fn(array);
        },
        underscore: function() {
            return _initial(array, 5);
        },
        lodash: function() {
            return __initial(array, 5);
        }
    }
}];
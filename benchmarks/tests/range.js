var _ = require('underscore');
var __ = require('lodash');
var dp = require('../../dist/datapipe');

var _range = _.range;
var __range = __.range;

var fn = dp().range(0, 20, 3).fn();
var nativeFn = function() {
    return [0, 3, 6, 9, 12, 15, 18];
};

module.exports = {
    name: 'range',
    tests: {
        native: function() {
            return nativeFn();
        },
        undersorcery: function() {
            return fn();
        },
        underscore: function() {
            return _range(0, 20, 3);
        },
        lodash: function() {
            return __range(0, 20, 3);
        }
    }
};
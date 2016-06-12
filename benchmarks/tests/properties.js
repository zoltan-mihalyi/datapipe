var array = require('../array');
var _ = require('underscore');
var __ = require('lodash');
var dp = require('../../dist/datapipe');

var filter = {x: 1, y: 2};
var wrapper = {
    fn: dp('array').where(filter).fn(),
    nativeFn: function(array) {
        var result = [];
        var length = array.length;
        for (var i = 0; i < length; ++i) {
            var obj = array[i];
            if (obj.x === 1 && obj.y === 2) {
                result.push(obj);
            }
        }
        return result;
    }
};

module.exports = {
    name: 'properties filter',
    tests: {
        native: function() {
            return wrapper.nativeFn(array);
        },
        undersorcery: function() {
            return wrapper.fn(array);
        },
        underscore: function() {
            return _.where(array, filter);
        },
        lodash: function() {
            return __.filter(array, filter);
        }
    }
};
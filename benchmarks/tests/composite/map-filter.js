var array = require('../../array');
var _ = require('underscore');
var __ = require('lodash');
var dp = require('../../../dist/datapipe');

function map(x, i) {
    return x.x + i;
}

function filter(x, i) {
    return x % i === 0;
}

var wrapper = {
    fn: dp('array').map(map).filter(filter).fn(),
    nativeFn: function(array) {
        var result = [];
        var length = array.length;
        for (var i = 0; i < length; i++) {
            var obj = map(array[i], i);
            if (filter(obj, i)) {
                result.push(obj);
            }
        }
        return result;
    }
};


module.exports = {
    name: 'map and filter',
    tests: {
        native: function() {
            return wrapper.nativeFn(array);
        },
        undersorcery: function() {
            return wrapper.fn(array);
        },
        underscore: function() {
            return _.filter(_.map(array, map), filter);
        },
        lodash: function() {
            return __.filter(__.map(array, map), filter);
        }
    }
};

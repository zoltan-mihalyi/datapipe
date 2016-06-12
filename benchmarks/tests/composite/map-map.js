var array = require('../../array');
var _ = require('underscore');
var __ = require('lodash');
var dp = require('../../../dist/datapipe');

function map1(x, i) {
    return x.x + i;
}
function map2(x) {
    return x + 1;
}
var wrapper = {
    fn: dp().map(map1).map(map2).fn(),
    nativeFn: function(array) {
        var result = new Array(array.length);
        var length = array.length;
        for (var i = 0; i < length; ++i) {
            result[i] = map2(map1(array[i], i));
        }
        return result;
    }
};


module.exports = {
    name: 'map two times',
    tests: {
        native: function() {
            return wrapper.nativeFn(array);
        },
        undersorcery: function() {
            return wrapper.fn(array);
        },
        underscore: function() {
            return _.map(_.map(array, map1), map2);
        },
        lodash: function() {
            return __.map(__.map(array, map1), map2);
        }
    }
};
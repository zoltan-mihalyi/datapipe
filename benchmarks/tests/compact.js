var _ = require('underscore');
var __ = require('lodash');
var u = require('../../dist/main');

var _compact = _.compact;
var __compact = __.compact;

var array = [0, 1, '', 2, null, void 0, 3, false, 4];

var fn = u('array').compact().fn();
var nativeFn = function(array) {
    var result = [];
    var length = array.length;
    for (var i = 0; i < length; ++i) {
        var obj = array[i];
        if (obj) {
            result.push(obj);
        }
    }
    return result;
};

module.exports = [{
    name: 'compact',
    tests: {
        native: function() {
            return nativeFn(array);
        },
        undersorcery: function() {
            return fn(array);
        },
        underscore: function() {
            return _compact(array);
        },
        lodash: function() {
            return __compact(array);
        }
    }
}];
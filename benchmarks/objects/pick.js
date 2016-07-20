var _ = require('underscore');
var __ = require('lodash');
var u = require('../../dist/main');

var hasOwnProperty = Object.prototype.hasOwnProperty;

var _pick = _.pick;
var __pick = __.pick;
var __pickBy = __.pickBy;

var obj = {
    a: 1,
    b: 2,
    c: 3,
    d: 4
};

var fn1 = u('map').pick('a', 'b').fn();
var nativeFn1 = function(obj) {
    return obj ? {
        a: obj.a,
        b: obj.b
    } : {};
};

//noinspection JSUnusedLocalSymbols
function picker(value, key) {
    return key < 'c';
}
var fn2 = u('map').pick(picker).fn();
var nativeFn2 = function(obj) {
    var result = {};
    for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) {
            var value = obj[key];
            if (picker(value, key)) {
                result[key] = value;
            }
        }
    }
    return result;
};


module.exports = [{
    name: 'pick properties',
    tests: {
        native: function() {
            return nativeFn1(obj);
        },
        undersorcery: function() {
            return fn1(obj);
        },
        underscore: function() {
            return _pick(obj, 'a', 'b');
        },
        lodash: function() {
            return __pick(obj, 'a', 'b');
        }
    }
}, {
    name: 'pick function',
    tests: {
        native: function() {
            return nativeFn2(obj);
        },
        undersorcery: function() {
            return fn2(obj);
        },
        underscore: function() {
            return _pick(obj, picker);
        },
        lodash: function() {
            return __pickBy(obj, picker);
        }
    }
}];
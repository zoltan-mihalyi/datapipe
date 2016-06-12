var array = require('../array');
var _ = require('underscore');
var __ = require('lodash');
var dp = require('../../dist/datapipe');

function predicate(x) {
    return x.x > 0;
}

function predicate2(x, i) {
    return i !== 3;
}

var wrapper1 = {
    fn: dp('array').every(predicate).fn(),
    nativeFn: function(array) {
        var length = array.length;
        for (var i = 0; i < length; i++) {
            if (!(array[i].x > 0)) {
                return false;
            }
        }
        return true;
    }
};

var wrapper2 = {
    fn: dp('array').every(predicate2).fn(),
    nativeFn: function(array) {
        var length = array.length;
        for (var i = 0; i < length; i++) {
            if (i === 3) {
                return false;
            }
        }
        return true;
    }
};

module.exports = [{
    name: 'every until end',
    tests: {
        native: function() {
            return wrapper1.nativeFn(array);
        },
        undersorcery: function() {
            return wrapper1.fn(array);
        },
        underscore: function() {
            return _.every(array, predicate);
        },
        lodash: function() {
            return __.every(array, predicate);
        }
    }
}, {
    name: 'every to half',
    tests: {
        native: function() {
            return wrapper2.nativeFn(array);
        },
        undersorcery: function() {
            return wrapper2.fn(array);
        },
        underscore: function() {
            return _.every(array, predicate2);
        },
        lodash: function() {
            return __.every(array, predicate2);
        }
    }
}];
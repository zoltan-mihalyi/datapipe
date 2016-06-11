var array = require('../array');
var _ = require('underscore');
var __ = require('lodash');
var dp = require('../../dist/datapipe');

function filter(x) {
    return x.x === 1;
}
var wrapper1 = {
    fn: dp('array').filter(filter).fn(),
    nativeFn: function(array) {
        var result = [];
        for (var i = 0; i < array.length; i++) {
            var obj = array[i];
            if (obj.x === 1) {
                result.push(obj);
            }
        }
        return result;
    }
};

function filter2(x, i) {
    return i % 2 === 0;
}
var wrapper2 = {
    fn: dp('array').filter(filter2).fn(),
    nativeFn: function(array) {
        var result = [];
        for (var i = 0; i < array.length; i++) {
            if (i % 2 === 0) {
                result.push(array[i]);
            }
        }
        return result;
    }
};

var context = {
    modulo: 0
};

function filter3(x, i) {
    return i % 2 === this.modulo;
}
var wrapper3 = {
    fn: dp('array').filter(filter3, context).fn(),
    nativeFn: function(array) {
        var result = [];
        for (var i = 0; i < array.length; i++) {
            var obj = array[i];
            if (filter3.call(context, obj, i)) {
                result.push(obj);
            }
        }
        return result;
    }
};

module.exports = [{
    name: 'filter without index',
    tests: {
        native: function() {
            return wrapper1.nativeFn(array);
        },
        undersorcery: function() {
            return wrapper1.fn(array);
        },
        underscore: function() {
            return _.filter(array, filter);
        },
        lodash: function() {
            return __.filter(array, filter);
        }
    }
}, {
    name: 'filter with index',
    tests: {
        native: function() {
            return wrapper2.nativeFn(array);
        },
        undersorcery: function() {
            return wrapper2.fn(array);
        },
        underscore: function() {
            return _.filter(array, filter2);
        },
        lodash: function() {
            return __.filter(array, filter2);
        }
    }
}, {
    name: 'filter with context',
    tests: {
        native: function() {
            return wrapper3.nativeFn(array);
        },
        undersorcery: function() {
            return wrapper3.fn(array);
        },
        underscore: function() {
            return _.filter(array, filter3, context);
        }
    }
}];
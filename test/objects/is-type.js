var u = require('../../dist/main');

describe('is... tests', function() {
    it('isArray tests', function() {
        var isArray = u()
            .isArray()
            .fn();

        expect(isArray([])).toBe(true);
        expect(isArray('')).toBe(false);
        expect(isArray(null)).toBe(false);
        expect(isArray({})).toBe(false);
    });

    it('isArray tests with hint', function() {
        var isArray = u('array')
            .isArray()
            .fn();

        expect(isArray([])).toBe(true);
        expect(isArray.toString()).toContain('true;'); //no function call
    });

    it('isObject tests', function() {
        var isObject = u()
            .isObject()
            .fn();

        expect(isObject({})).toBe(true);
        expect(isObject([])).toBe(true);
        expect(isObject(function() {
        })).toBe(true);
        expect(isObject('')).toBe(false);
        expect(isObject(null)).toBe(false);
        expect(isObject(2)).toBe(false);
    });

    it('isObject with hint', function() {
        var isObject = u('array')
            .isObject()
            .fn();

        expect(isObject({})).toBe(true);
        expect(isObject.toString()).not.toContain('typeof'); //no type check
    });

    it('isArguments', function() {
        function args() {
            return arguments;
        }

        var isArguments = u()
            .isArguments()
            .fn();

        expect(isArguments(args())).toBe(true);
        expect(isArguments(null)).toBe(false);
        expect(isArguments([])).toBe(false);
    });

    it('isFunction', function() {

        var isFunction = u()
            .isFunction()
            .fn();

        expect(isFunction(function() {
        })).toBe(true);
        expect(isFunction(null)).toBe(false);
        expect(isFunction({})).toBe(false);
    });

    it('isString', function() {
        var isString = u()
            .isString()
            .fn();

        expect(isString('abc')).toBe(true);
        expect(isString(Object('abc'))).toBe(true);
        expect(isString(42)).toBe(false);
    });

    it('isNumber', function() {
        var isNumber = u()
            .isNumber()
            .fn();

        expect(isNumber(42)).toBe(true);
        expect(isNumber(Object(42))).toBe(true);
        expect(isNumber('abc')).toBe(false);
    });

    it('isFinite', function() {
        var isFinite = u()
            .isFinite()
            .fn();

        expect(isFinite(42)).toBe(true);
        expect(isFinite(Object(42))).toBe(true);
        expect(isFinite('42')).toBe(true);
        expect(isFinite(Object('42'))).toBe(true);
        expect(isFinite('42x')).toBe(false);
        expect(isFinite('')).toBe(false);
        expect(isFinite(Infinity)).toBe(false);
        expect(isFinite(-Infinity)).toBe(false);
        expect(isFinite(Object(Infinity))).toBe(false);
        expect(isFinite(Object(-Infinity))).toBe(false);
        expect(isFinite(null)).toBe(false);
        expect(isFinite(void 0)).toBe(false);
        expect(isFinite({})).toBe(false);
    });

    it('isBoolean', function() {
        var isBoolean = u()
            .isBoolean()
            .fn();

        expect(isBoolean(true)).toBe(true);
        expect(isBoolean(false)).toBe(true);
        expect(isBoolean(Object(true))).toBe(true);
        expect(isBoolean(null)).toBe(false);
        expect(isBoolean(1)).toBe(false);
    });

    it('isDate', function() {
        var isDate = u()
            .isDate()
            .fn();

        expect(isDate(new Date())).toBe(true);
        expect(isDate(12)).toBe(false);
    });

    it('isRegExp', function() {
        var isRegExp = u()
            .isRegExp()
            .fn();

        expect(isRegExp(/abc/i)).toBe(true);
        expect(isRegExp(new RegExp('abc', 'i'))).toBe(true);
        expect(isRegExp('abc')).toBe(false);
    });

    it('isError', function() {
        var isError = u()
            .isError()
            .fn();

        expect(isError(new TypeError('error'))).toBe(true);
        expect(isError('error')).toBe(false);
    });

    it('isNaN', function() {
        var isNaN = u()
            .isNaN()
            .fn();

        expect(isNaN(NaN)).toBe(true);
        expect(isNaN(Object(NaN))).toBe(true);
        expect(isNaN(42)).toBe(false);
        expect(isNaN(Object(42))).toBe(false);
        expect(isNaN('abc')).toBe(false);
        expect(isNaN(new Date(NaN))).toBe(false);
    });

    it('isNull', function() {
        var isNull = u()
            .isNull()
            .fn();

        expect(isNull(null)).toBe(true);
        expect(isNull(void 0)).toBe(false);
        expect(isNull(0)).toBe(false);
    });

    it('isUndefined', function() {
        var isUndefined = u()
            .isUndefined()
            .fn();

        expect(isUndefined(void 0)).toBe(true);
        expect(isUndefined(null)).toBe(false);
        expect(isUndefined(0)).toBe(false);
    });
});
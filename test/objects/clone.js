var u = require('../../dist/main');

describe('clone tests', function() {
    it('clone object', function() {
        var obj = {a: 1, b: 2};
        var cloned = u().clone().process(obj);
        expect(cloned).not.toBe(obj);
        expect(cloned).toEqual(obj);
    });

    it('clone object with parent', function() {
        function Obj() {
            this.a = 1;
        }

        Obj.prototype.b = 2;
        expect(u()
            .clone()
            .process(new Obj())
        ).toEqual({a: 1, b: 2});
    });

    it('clone array', function() {
        var arr = [1, 2, 3];
        var cloned = u().clone().process(arr);
        expect(cloned).not.toBe(arr);
        expect(cloned).toEqual(arr);
    });

    it('clone number', function() {
        expect(u()
            .clone()
            .process(42)
        ).toBe(42);
    });

    it('clone string', function() {
        expect(u()
            .clone()
            .process('abc')
        ).toBe('abc');
    });

    it('clone null', function() {
        expect(u()
            .clone()
            .process(null)
        ).toBe(null);
    });

    it('remove unnecessary clone', function() {
        expect(u()
            .map('a')
            .clone()
            .fn()
            .toString()
        ).toEqual(u().map('a').fn().toString());
    });

    it('clone object with hint', function() {
        var fn = u('map')
            .clone()
            .fn();
        expect(fn({a: 1, b: 2})).toEqual({a: 1, b: 2});
        expect(fn.toString()).not.toContain('++');
    });

    it('clone array with hint', function() {
        var fn = u('array')
            .clone()
            .fn();
        expect(fn([1, 2])).toEqual([1, 2]);
        expect(fn.toString()).not.toContain(' in ');
    });
});
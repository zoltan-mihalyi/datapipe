var u = require('../../dist/main');

describe('extend tests', function() {
    it('extend with one source', function() {
        var obj = {a: 0, d: 1};
        var result = u()
            .extend({a: 1, b: 2, c: 3})
            .process(obj);
        expect(result).toBe(obj);
        expect(result).toEqual({a: 1, b: 2, c: 3, d: 1});
    });

    it('extend with multiple sources', function() {
        expect(u()
            .extend({a: 1, b: 2}, {b: 3})
            .process({a: 0, d: 1})
        ).toEqual({a: 1, b: 3, d: 1});
    });

    it('extend with parent', function() {
        function Obj() {
            this.a = 1;
        }

        Obj.prototype.x = 1;
        expect(u()
            .extend(new Obj())
            .process({a: 0, b: 1})
        ).toEqual({a: 1, b: 1, x: 1});
    });

    it('extend array', function() {
        expect(u()
            .extend({1: 2})
            .process([0, 1, 2])
        ).toEqual([0, 2, 2]);
    });

    it('extend null', function() {
        expect(u()
            .extend({1: 2})
            .process(null)
        ).toBeNull();
    });

    it('extend string', function() {
        expect(u()
            .extend({1: 2})
            .process('abc')
        ).toBe('abc');
    });

    it('extend number', function() {
        expect(u()
            .extend({1: 2})
            .process(42)
        ).toBe(42);
    });

    it('extend with string source', function() {
        expect(u()
            .extend('abc')
            .process({})
        ).toEqual({});
    });

    it('extend with function source', function() {
        function fn() {
        }

        fn.x = 1;
        expect(u()
            .extend(fn)
            .process({})
        ).toEqual({x: 1});
    });
});
var u = require('../../dist/main');

describe('keys tests', function() {
    it('object keys', function() {
        expect(u()
            .keys()
            .process({a: 1, b: null, c: void 0})
        ).toEqual(['a', 'b', 'c']);
    });

    it('array keys', function() {
        expect(u()
            .keys()
            .process([1, 2, 3])
        ).toEqual(['0', '1', '2']);
    });

    it('array with extra properties keys', function() {
        var array = [1, 2];
        array.x = 3;
        expect(u()
            .keys()
            .process(array)
        ).toEqual(['0', '1', 'x']);
    });

    it('object with parent keys', function() {
        function Obj() {
            this.a = 1;
            this.b = null;
            this.c = void 0;
        }

        Obj.prototype.d = 1;
        Obj.prototype.e = null;
        Obj.prototype.f = void 0;
        expect(u()
            .keys()
            .process(new Obj())
        ).toEqual(['a', 'b', 'c']);
    });


    it('function keys', function() {
        function f() {
        }

        f.a = 1;
        f.b = 2;

        expect(u()
            .keys()
            .process(f)
        ).toEqual(['a', 'b']);
    });

    it('null and undefined keys', function() {
        expect(u()
            .keys()
            .process(null)
        ).toEqual([]);

        expect(u()
            .keys()
            .process()
        ).toEqual([]);
    });

    it('string keys', function() {
        expect(u()
            .keys()
            .process('abc')
        ).toEqual([]);
    });

    it('if result is array or object, should avoid isObject check', function() {
        expect(u()
            .keys()
            .fn()
            .toString()
        ).toContain('object');

        expect(u('array')
            .keys()
            .fn()
            .toString()
        ).not.toContain('object');

        expect(u('object')
            .keys()
            .fn()
            .toString()
        ).not.toContain('object');
    });

    it('if result is array or object, keys should work as well', function() {
        expect(u('object')
            .keys()
            .process({a: 1, b: null, c: void 0})
        ).toEqual(['a', 'b', 'c']);

        expect(u('array')
            .keys()
            .process([1, 2, 3])
        ).toEqual(['0', '1', '2']);
    })
});
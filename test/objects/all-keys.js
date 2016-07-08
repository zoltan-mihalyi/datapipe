var u = require('../../dist/main');

describe('allKeys tests', function() {
    function Obj() {
        this.a = 1;
        this.b = null;
        this.c = void 0;
    }

    Obj.prototype.d = 1;
    Obj.prototype.e = null;
    Obj.prototype.f = void 0;

    it('object allKeys', function() {
        expect(u()
            .allKeys()
            .process({a: 1, b: null, c: void 0})
        ).toEqual(['a', 'b', 'c']);
    });

    it('object with parent allKeys', function() {
        expect(u()
            .allKeys()
            .process(new Obj())
        ).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
    });

    it('function allKeys', function() {
        function f() {
        }

        f.a = 1;
        f.b = 2;

        expect(u()
            .allKeys()
            .process(f)
        ).toEqual(['a', 'b']);
    });

    it('null and undefined allKeys', function() {
        expect(u()
            .allKeys()
            .process(null)
        ).toEqual([]);

        expect(u()
            .allKeys()
            .process()
        ).toEqual([]);
    });

    it('string allKeys', function() {
        expect(u()
            .allKeys()
            .process('abc')
        ).toEqual([]);
    });

    it('allKeys should not evaluate the values of the object', function() {
        expect(u()
            .allKeys()
            .fn()
            .toString()
            .match(/\[[^\]]/g) //find indexing
        ).toBeNull();
    });

    it('allKeys chaining', function() {
        expect(u()
            .allKeys()
            .map(function(key) {
                return '_' + key;
            })
            .process(new Obj())
        ).toEqual(['_a', '_b', '_c', '_d', '_e', '_f']);
    });

    it('allKeys chaining should be done in one loop', function() {
        expect(u()
            .allKeys()
            .map(function() {
            })
            .fn()
            .toString()
            .match(/for/g)
            .length
        ).toBe(1);
    });
});
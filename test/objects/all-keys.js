var u = require('../../dist/main');

describe('allKeys tests', function() {
    it('object allKeys', function() {
        expect(u()
            .allKeys()
            .process({a: 1, b: null, c: void 0})
        ).toEqual(['a', 'b', 'c']);
    });

    it('object with parent allKeys', function() {
        function Obj() {
            this.a = 1;
            this.b = null;
            this.c = void 0;
        }

        Obj.prototype.d = 1;
        Obj.prototype.e = null;
        Obj.prototype.f = void 0;
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
});
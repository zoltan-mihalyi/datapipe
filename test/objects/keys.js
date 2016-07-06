var u = require('../../dist/main');

describe('keys tests', function() {
    it('object keys', function() {
        expect(u()
            .keys()
            .process({a: 1, b: null, c: void 0})
        ).toEqual(['a', 'b', 'c']);
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
});
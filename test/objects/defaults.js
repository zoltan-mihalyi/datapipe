var u = require('../../dist/main');

describe('defaults tests', function() {
    it('defaults with one source', function() {
        var obj = {a: 0, d: 1};
        var result = u()
            .defaults({a: 1, b: 2, c: 3})
            .process(obj);
        expect(result).toBe(obj);
        expect(result).toEqual({a: 0, b: 2, c: 3, d: 1});
    });

    it('defaults with multiple sources', function() {
        expect(u()
            .defaults({a: 1, b: 2}, {b: 3, c: 3})
            .process({a: 0, d: 1})
        ).toEqual({a: 0, b: 2, c: 3, d: 1});
    });

    it('defaults with parent', function() {
        function Obj() {
            this.a = 1;
        }

        Obj.prototype.b = 2;
        expect(u()
            .defaults(new Obj())
            .process({})
        ).toEqual({a: 1, b: 2});
    });
});
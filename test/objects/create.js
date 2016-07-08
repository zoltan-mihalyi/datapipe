var u = require('../../dist/main');

describe('create tests', function() {
    function Base() {

    }

    Base.prototype = {p: 1};

    it('create without props', function() {

        var result = u()
            .create()
            .process(Base.prototype);

        expect(result instanceof Base).toBe(true);
        expect(Object.keys(result)).toEqual([]);
        expect(result.p).toBe(1);
    });

    it('create with props', function() {
        var result = u()
            .create({a: 1, b: null, c: void 0})
            .process(Base.prototype);

        expect(result instanceof Base).toBe(true);
        expect(Object.keys(result)).toEqual(['a', 'b', 'c']);
        expect(result.a).toBe(1);
        expect(result.b).toBe(null);
        expect(result.c).toBeUndefined();
        expect(result.p).toBe(1);
    });
});

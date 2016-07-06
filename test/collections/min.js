var u = require('../../dist/main');

describe('min tests', function() {
    it('min should work as expected', function() {
        expect(u()
            .min()
            .process([5, 6, 3, 2, 4])
        ).toBe(2);
    });

    it('min with iteratee', function() {
        expect(u()
            .min(function(x) {
                return x.x;
            })
            .process([{x: 3}, {x: 2}, {x: 1}, {x: 4}])
        ).toEqual({x: 1});
    });

    it('min with context', function() {
        expect(u()
            .min(function(x) {
                return x[this];
            }, 'x')
            .process([{x: 3}, {x: 2}, {x: 1}, {x: 4}])
        ).toEqual({x: 1});
    });

    it('min with property', function() {
        expect(u()
            .min('x')
            .process([{x: 3}, {x: 2}, {x: 1}, {x: 4}])
        ).toEqual({x: 1});
    });

    it('min with properties', function() {
        expect(u()
            .min({x: 1})
            .process([{x: 1}, {x: 3}, {x: 2}, {x: 1}, {x: 4}])
        ).toEqual({x: 3});
    });

    it('min with 0 element', function() {
        expect(u()
            .min()
            .process([])
        ).toBe(Infinity);

        expect(u()
            .min(function(x) {
                return x.x;
            })
            .process([])
        ).toBe(Infinity);
    });
});
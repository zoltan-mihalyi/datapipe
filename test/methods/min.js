var dp = require('../../dist/datapipe');

describe('min tests', function() {
    it('min should work as expected', function() {
        expect(dp()
            .min()
            .process([5, 6, 3, 2, 4])
        ).toBe(2);
    });

    it('min with iteratee', function() {
        expect(dp()
            .min(function(x) {
                return x.x;
            })
            .process([{x: 3}, {x: 2}, {x: 1}, {x: 4}])
        ).toEqual({x: 1});
    });

    it('min with context', function() {
        expect(dp()
            .min(function(x) {
                return x[this];
            }, 'x')
            .process([{x: 3}, {x: 2}, {x: 1}, {x: 4}])
        ).toEqual({x: 1});
    });

    it('min with property', function() {
        expect(dp()
            .min('x')
            .process([{x: 3}, {x: 2}, {x: 1}, {x: 4}])
        ).toEqual({x: 1});
    });

    it('min with 0 element', function() {
        expect(dp()
            .min()
            .process([])
        ).toBe(Infinity);

        expect(dp()
            .min(function(x) {
                return x.x;
            })
            .process([])
        ).toBe(Infinity);
    });
});
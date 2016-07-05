var u = require('../../dist/main');

describe('max tests', function() {
    it('max should work as expected', function() {
        expect(u()
            .max()
            .process([5, 6, 3, 2, 4])
        ).toBe(6);
    });

    it('max with iteratee', function() {
        expect(u()
            .max(function(x) {
                return x.x;
            })
            .process([{x: 3}, {x: 2}, {x: 4}, {x: 1}])
        ).toEqual({x: 4});
    });

    it('max with context', function() {
        expect(u()
            .max(function(x) {
                return x[this];
            }, 'x')
            .process([{x: 3}, {x: 2}, {x: 4}, {x: 1}])
        ).toEqual({x: 4});
    });

    it('max with property', function() {
        expect(u()
            .max('x')
            .process([{x: 3}, {x: 2}, {x: 4}, {x: 1}])
        ).toEqual({x: 4});
    });

    it('max with 0 element', function() {
        expect(u()
            .max()
            .process([])
        ).toBe(-Infinity);

        expect(u()
            .max(function(x) {
                return x.x;
            })
            .process([])
        ).toBe(-Infinity);
    });
});
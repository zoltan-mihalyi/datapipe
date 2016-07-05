var u = require('../../dist/main');

describe('every tests', function() {
    it('every should return true if all of the elements match the predicate', function() {
        expect(u()
            .every(function(x) {
                return x % 2 === 0;
            })
            .process([2, 4, 6, 8])
        ).toBe(true);
    });

    it('every with context', function() {
        expect(u()
            .every(function(x) {
                return x % this.value === 0;
            }, {value: 2})
            .process([2, 4, 6, 8])
        ).toBe(true);
    });

    it('every should return true on empty arrays', function() {
        expect(u()
            .every(function() {
                throw new Error('Predicate called on what?');
            })
            .process([])
        ).toBe(true);
    });

    it('every should return false if any of the elements does not match the predicate', function() {
        expect(u()
            .every(function(x) {
                return x % 2 === 0;
            })
            .process([2, 4, 5, 8])
        ).toBe(false);
    });
});
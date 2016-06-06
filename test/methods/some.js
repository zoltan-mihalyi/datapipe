var dp = require('../../dist/datapipe');

describe('some tests', function() {

    it('some should return false if none of the elements match the predicate', function() {
        expect(dp()
            .some(function(x) {
                return x % 2 === 0;
            })
            .process([1, 3, 5, 7])
        ).toBe(false);
    });

    it('some with context', function() {
        expect(dp()
            .some(function(x) {
                return x % this.value === 0;
            }, {value: 2})
            .process([1, 3, 5, 7])
        ).toBe(false);
    });

    it('some should return false on empty arrays', function() {
        expect(dp()
            .some(function() {
                throw new Error('Predicate called on what?');
            })
            .process([])
        ).toBe(false);
    });

    it('some should return true if any of the elements match the predicate', function() {
        expect(dp()
            .some(function(x) {
                return x % 2 === 0;
            })
            .process([1, 3, 4, 5])
        ).toBe(true);
    });
});
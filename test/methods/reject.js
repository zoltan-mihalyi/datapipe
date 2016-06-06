var dp = require('../../dist/datapipe');

describe('reject tests', function() {
    it('Rejecting an array should return an array of the items NOT matching the predicate.', function() {
        expect(dp().reject(function(x) {
            return x % 2 === 0;
        }).process([0, 1, 2, 3, 4, 5])).toEqual([1, 3, 5]);
    });

    it('reject with context', function() {
        expect(dp().reject(function(x) {
            return x % 2 === this.value;
        }, {value: 0}).process([0, 1, 2, 3, 4, 5])).toEqual([1, 3, 5]);
    });
});
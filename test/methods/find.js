var dp = require('../../dist/datapipe');

describe('Test "find"', function() {
    it('Calling find should return the first item in the array matching the predicate.', function() {
        expect(dp().find(function(x) {
            return x % 3 === 0;
        }).process([1, 2, 3, 4, 5, 6])).toBe(3);
    });

    it('find with context', function() {
        expect(dp().find(function(x) {
            return x % this.value === 0;
        }, {value: 3}).process([1, 2, 3, 4, 5, 6])).toBe(3);
    });

    it('Calling find should return undefined when no items in the array are matching the predicate.', function() {
        expect(dp().find(function(x) {
            return x % 4 === 0;
        }).process([1, 2, 3])).toBeUndefined()
    });

    it('find and sortBy', function() {
        var array = [[2, 1]];
        var result = dp()
            .find(function() {
                return true;
            })
            .sortBy()
            .process(array);
        expect(result).not.toBe(array[0]);
        expect(result).toEqual([1, 2]);
    });
});
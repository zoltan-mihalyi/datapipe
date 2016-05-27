var dp = require('../dist/datapipe');

describe('Test functions without chaining', function() {
    it('Mapping an array should return an array with items mapped with the function.', function() {
        expect(dp().map(function(x) {
            return x + 1;
        }).process([-1, 0, 1])).toEqual([0, 1, 2]);
    });

    it('Filtering an array should return an array of the items matching the predicate.', function() {
        expect(dp().filter(function(x) {
            return x % 2 === 0;
        }).process([0, 1, 2, 3, 4])).toEqual([0, 2, 4]);
    });

    it('Iterating over an array with "each" causes the function to be called with the items of the array as parameter.', function() {
        var res = [];
        dp().each(function(x) {
            res.push(x);
        }).process([0, 1, 2]);
        expect(res).toEqual([0, 1, 2]);
    });

    it('Calling reduce should work as expected.', function() {
        expect(dp().reduce(function(memo, x) {
            return memo + x;
        }, '').process(['1', '2', '3', '4', '5'])).toBe('12345');
    });

    it('Calling reduce with a non-primitive non-function object should fail', function() {
        expect(function() {
            dp().reduce(function() {
            }, []);
        }).toThrow();
    });

    it('Calling reduce with a provider function should ', function() {
        var collect = dp().reduce(function(memo, x) {
            memo.push(x);
            return memo;
        }, function() {
            return [];
        });

        expect(collect.process([1, 2, 3])).toEqual([1, 2, 3]);
        expect(collect.process([4, 5, 6])).toEqual([4, 5, 6]);
    });

    it('Calling reduceRight should work as expected.', function() {
        expect(dp().reduceRight(function(memo, x) {
            return memo + x;
        }, '').process(['a', 'b', 'c', 'd', 'e'])).toBe('edcba');
    });

    describe('Test "find"', function() {
        it('Calling find should return the first item in the array matching the predicate.', function() {
            expect(dp().find(function(x) {
                return x % 3 === 0;
            }).process([1, 2, 3, 4, 5, 6])).toBe(3);
        });

        it('Calling find should return undefined when no items in the array are matching the predicate.', function() {
            expect(dp().find(function(x) {
                return x % 4 === 0;
            }).process([1, 2, 3])).toBeUndefined()
        });
    });
});

describe('Test functions with chaining', function() {
    it('map and filter', function() {
        expect(dp()
            .map(function(x) {
                return x * 10;
            })
            .filter(function(x) {
                return x % 20 === 0;
            })
            .process([1, 2, 3, 4])).toEqual([20, 40]);
    });

    it('map and each', function() {
        var result = [];
        dp()
            .map(function(x) {
                return x * 10;
            })
            .each(function(x) {
                result.push(x);
            })
            .process([1, 2, 3, 4]);

        expect(result).toEqual([10, 20, 30, 40]);
    });

    it('map and reduce', function() {
        expect(dp()
            .map(function(x) {
                return x * 10;
            })
            .reduce(function(memo, x) {
                return memo + x;
            }, '')
            .process([1, 2, 3, 4])).toEqual('10203040');
    });
});
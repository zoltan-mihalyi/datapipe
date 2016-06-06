var dp = require('../dist/datapipe');

describe('Passing index to functions', function() {
    it('should pass index when needed', function() {
        expect(dp()
            .map(function(x, i) {
                return i;
            })
            .process([1, 2, 3, 4, 5])
        ).toEqual([0, 1, 2, 3, 4]);

        expect(dp()
            .reduce(function(memo, x, i) {
                return memo + i;
            }, 0)
            .process([1, 2, 3])
        ).toEqual(3);

        expect(dp()
            .indexBy(function(x, i) {
                return i;
            })
            .process([1, 2, 3])
        ).toEqual({
            0: 1,
            1: 2,
            2: 3
        });
    });

    it('When iterating an object, the index passed to the function should be the key of the entry, not the index.', function() {
        expect(dp()
            .map(function(x, i) {
                return i;
            })
            .process({
                a: 1,
                b: 2,
                c: 3
            })
        ).toEqual(['a', 'b', 'c']);
    });

    it('object to array transformation should change index', function() {
        expect(dp()
            .map(function(a) {
                return a;
            })
            .map(function(x, i) {
                return i;
            })
            .process({
                a: 1,
                b: 2,
                c: 3
            })
        ).toEqual([0, 1, 2]);
    });

    it('should work with changing index, creating additional index variable', function() {
        var process = dp()
            .filter(function(x) {
                return x % 2 === 0;
            })
            .map(function(x, i) {
                return i;
            }).fn();

        expect(process([0, 1, 2, 3, 4, 5])).toEqual([0, 1, 2]);
        expect(process.toString()).toContain('var i_');

    });

    it('after a changing index, creating one index variable for multiple steps', function() {
        var process = dp()
            .filter(function(x) {
                return x % 2 === 0;
            })
            .map(function(x, i) {
                return i;
            })
            .map(function(x, i) {
                return i;
            }).fn();

        expect(process([0, 1, 2, 3, 4, 5])).toEqual([0, 1, 2]);
        expect(process.toString()).not.toContain('var i_1');

    });

    it('should work when the same step modifies the index which uses it.', function() {
        expect(dp()
            .filter(function(x, i) {
                return i % 2 === 0;
            })
            .process([1, 2, 3, 4])
        ).toEqual([1, 3]);
    });

    it('should not create additional index variable when not using index', function() {
        expect(dp()
            .filter(function() {
            })
            .map(function(x) {
                return x;
            })
            .fn()
            .toString()
        ).not.toContain('var i_');
    });

    it('should generate lesser code when the index parameter is not used', function() {
        expect(dp()
            .map(function() {
            })
            .fn()
            .toString()
            .length
        ).toBeLessThan(dp()
            .map(function(x, i) {
                return i;
            })
            .fn()
            .toString()
            .length
        );
    });
});
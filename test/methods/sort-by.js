var dp = require('../../dist/datapipe');

describe('sortBy tests', function() {
    it('sortBy without parameters should return a simple sorted array.', function() {
        expect(dp()
            .sortBy()
            .process([3, 6, 2, 4, 1, 5])
        ).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('sortBy with rank provider.', function() {
        expect(dp()
            .sortBy(function(x) {
                return Math.sin(x);
            })
            .process([1, 2, 3, 4, 5, 6])
        ).toEqual([5, 4, 6, 3, 1, 2]);
    });

    it('sortBy with context', function() {
        expect(dp()
            .sortBy(function(x) {
                return this.sin(x);
            }, Math)
            .process([1, 2, 3, 4, 5, 6])
        ).toEqual([5, 4, 6, 3, 1, 2]);
    });

    it('sortBy with property name.', function() {
        expect(dp()
            .sortBy('x')
            .process([{x: 2}, {x: 1, y: 2}, {x: 3}, {y: 1}])
        ).toEqual([{x: 1, y: 2}, {x: 2}, {x: 3}, {y: 1}]);
    });

    it('sortBy does not modify the original array', function() {
        var array = [3, 1, 2];
        dp()
            .sortBy()
            .process(array);
        dp()
            .each(function() {
            })
            .sortBy()
            .process(array);
        expect(array).toEqual([3, 1, 2])
    });

    it('sortBy does not copy the array when the array is created by a previous step.', function() {
        expect(dp()
            .take(2)
            .sortBy()
            .fn()
            .toString()
        ).not.toContain('slice');
    });

    it('shortBy should work on objects', function() {
        expect(dp()
            .sortBy()
            .process({a: 2, b: 1, c: 3})
        ).toEqual([1, 2, 3]);
    });
});
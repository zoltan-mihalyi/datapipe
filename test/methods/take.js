var dp = require('../../dist/datapipe');

describe('take tests', function() {
    it('Calling take should work as expected.', function() {
        expect(dp().take(3).process([1, 2, 3, 4, 5, 6])).toEqual([1, 2, 3]);
    });

    it('take more than array length', function() {
        expect(dp()
            .take(3)
            .process([1, 2])
        ).toEqual([1, 2])
    });

    it('take with object', function() {
        expect(dp().take(3).process({a: 1, b: 2, c: 3, d: 4, e: 5, f: 6})).toEqual([1, 2, 3]);
    });

    it('take without parameter', function() {
        expect(dp().take().process([1, 2, 3])).toBe(1);
    });

    it('take and sortBy', function() {
        var array = [[3, 2, 1, 4]];
        var sorted = dp().take().sortBy().process(array);
        expect(sorted).toEqual([1, 2, 3, 4]);
        expect(sorted).not.toBe(array[0]);
    });

    it('first is identical to take', function() {
        expect(dp().first().process([1, 2, 3])).toBe(1);
    });

    it('head is identical to take', function() {
        expect(dp().head().process([1, 2, 3])).toBe(1);
    });

    it('using take after map should use fixed array length', function() {
        expect(dp()
            .map(function() {
            })
            .take(2)
            .fn()
            .toString()
        ).toContain('new Array');
    });

    it('using take twice should iterate until the smaller number', function() {
        expect(dp('array')
            .take(2)
            .take(3)
            .fn()
            .toString()
        ).not.toContain('3');
    });
});
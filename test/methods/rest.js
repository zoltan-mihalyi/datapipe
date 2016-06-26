var dp = require('../../dist/datapipe');

describe('rest tests', function() {
    it('Calling rest should exclude N elements at the beginning of the array.', function() {
        expect(dp().rest(2).process([1, 2, 3, 4, 5, 6])).toEqual([3, 4, 5, 6]);
    });

    it('rest with object', function() {
        expect(dp().rest(2).process({a: 1, b: 2, c: 3, d: 4, e: 5, f: 6})).toEqual([3, 4, 5, 6]);
    });

    it('rest without parameter', function() {
        expect(dp().rest().process([1, 2, 3])).toEqual([2, 3]);
    });

    it('using rest after map should use fixed array length', function() {
        expect(dp()
            .map(function() {
            })
            .rest(2)
            .fn()
            .toString()
        ).toContain('new Array');
    });

    it('using rest twice should be the same as calling rest with the sum', function() {
        expect(dp('array')
            .rest(2)
            .rest(3)
            .fn()
            .toString()
        ).toBe(dp('array').rest(5).fn().toString());
    });

    it('rest index bigger than array length', function() {
        expect(dp()
            .rest(3)
            .process([1, 2])
        ).toEqual([]);
    });

    it('using rest after take', function() {
        expect(dp()
            .take(2)
            .rest(1)
            .process([1, 2, 3])
        ).toEqual([2]);
    });

    it('using reduceRight after rest', function() {
        expect(dp()
            .rest(2)
            .reduceRight(function(memo, x) {
                return memo + x;
            }, '')
            .process([1, 2, 3, 4, 5])
        ).toBe('543');
    });
});
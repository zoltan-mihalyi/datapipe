var dp = require('../../dist/datapipe');

describe('last tests', function() {
    it('Calling last should work as expected.', function() {
        expect(dp().last(2).process([1, 2, 3, 4, 5, 6])).toEqual([5, 6]);
    });

    it('last more than array length', function() {
        expect(dp()
            .last(3)
            .process([1, 2])
        ).toEqual([1, 2])
    });

    it('last with map', function() {
        expect(dp().last(2).process({a: 1, b: 2, c: 3, d: 4, e: 5, f: 6})).toEqual([5, 6]);
    });

    it('last without parameter', function() {
        expect(dp().last().process([1, 2, 3])).toBe(3);
    });

    it('last with map and without parameter', function() {
        expect(dp().last().process({a: 1, b: 2, c: 3})).toBe(3);
    });

    it('last without parameter should not use loop', function() {
        expect(dp('array').last().fn().toString()).not.toContain('for');
    });

    it('last and sortBy', function() {
        var array = [[3, 2, 1, 4]];
        var sorted = dp().last().sortBy().process(array);
        expect(sorted).toEqual([1, 2, 3, 4]);
        expect(sorted).not.toBe(array[0]);
    });

    it('using last after map should use fixed array length', function() {
        expect(dp()
            .map(function() {
            })
            .last(2)
            .fn()
            .toString()
        ).toContain('new Array');
    });

    it('using last twice should iterate until the smaller number', function() {
        expect(dp('array')
            .last(2)
            .last(3)
            .fn()
            .toString()
        ).not.toContain('3');
    });

    it('last and initial', function() {
        expect(dp()
            .last(2)
            .initial(2)
            .process([1, 2, 3])
        ).toEqual([]);
    });

    //todo rest and last
});
var dp = require('../../dist/datapipe');

describe('size tests', function() {
    it('array size', function() {
        expect(dp().size().process([1, 2, 3])).toEqual(3);
    });

    it('object size', function() {
        expect(dp().size().process({a: 1, b: 2, c: 3})).toEqual(3);
    });

    it('reduce and size', function() {
        expect(dp()
            .reduce(function(memo, x) {
                if (x % 2 === 0) {
                    memo.push(x);
                }
                return memo;
            }, function() {
                return [];
            })
            .size()
            .process([1, 2, 3, 4, 5, 6])
        ).toBe(3);
    });

    it('size should not use iteration to determine array size', function() {
        expect(dp()
            .size()
            .fn()
            .toString()
        ).not.toContain('<');
    });
});
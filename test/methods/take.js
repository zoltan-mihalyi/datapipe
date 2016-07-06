var u = require('../../dist/main');

describe('take tests', function() {
    it('Calling take should work as expected.', function() {
        expect(u().take(3).process([1, 2, 3, 4, 5, 6])).toEqual([1, 2, 3]);
    });

    it('take more than array length', function() {
        expect(u()
            .take(3)
            .process([1, 2])
        ).toEqual([1, 2])
    });

    it('take with object', function() {
        expect(u().take(3).process({a: 1, b: 2, c: 3, d: 4, e: 5, f: 6})).toEqual([1, 2, 3]);
    });

    it('take without parameter', function() {
        expect(u().take().process([1, 2, 3])).toBe(1);
    });

    it('take and index', function() {
        expect(u()
            .take(3)
            .map(function(x, i) {
                return i;
            })
            .process([1, 2, 3, 4, 5])
        ).toEqual([0, 1, 2]);
    });

    it('take and object index', function() {
        expect(u()
            .take(3)
            .map(function(x, i) {
                return i;
            })
            .process({
                a: 1,
                b: 2,
                c: 3,
                d: 4
            })
        ).toEqual([0, 1, 2]);
    });

    it('take and sortBy', function() {
        var array = [[3, 2, 1, 4]];
        var sorted = u().take().sortBy().process(array);
        expect(sorted).toEqual([1, 2, 3, 4]);
        expect(sorted).not.toBe(array[0]);
    });

    it('first is identical to take', function() {
        expect(u().first().process([1, 2, 3])).toBe(1);
    });

    it('head is identical to take', function() {
        expect(u().head().process([1, 2, 3])).toBe(1);
    });

    it('using take after map should use fixed array length', function() {
        expect(u()
            .map(function() {
            })
            .take(2)
            .fn()
            .toString()
        ).toContain('new Array');
    });

    it('using take twice should iterate until the smaller number', function() {
        expect(u('array')
            .take(2)
            .take(3)
            .fn()
            .toString()
        ).not.toContain('3');

        expect(u('array')
            .take(3)
            .take(2)
            .fn()
            .toString()
        ).not.toContain('3');
    });

    it('take first and size', function() {
        expect(u()
            .take()
            .size()
            .process([{a: 1, b: 2}, {}, {}])
        ).toBe(2);
    });

    it('take and size', function() {
        var fn = u()
            .take(3)
            .size()
            .fn();
        expect(fn([1, 2])).toBe(2);
        expect(fn([1, 2, 3, 4])).toBe(3);
    });

    it('take and initial', function() {
        expect(u()
            .take(2)
            .initial(2)
            .process([1, 2, 3])
        ).toEqual([]);
    });

    it('take and reduce', function() {
        expect(u()
            .take(2)
            .reduce(function(memo, x) {
                return memo + x;
            }, '')
            .process([1, 2, 3])
        ).toEqual('12');
    });

    it('take and reduceRight', function() {
        expect(u()
            .take(2)
            .reduceRight(function(memo, x) {
                return memo + x;
            }, '')
            .process([1, 2, 3])
        ).toEqual('21');
    });
});
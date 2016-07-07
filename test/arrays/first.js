var u = require('../../dist/main');

describe('first tests', function() {
    it('Calling first should work as expected.', function() {
        expect(u().first(3).process([1, 2, 3, 4, 5, 6])).toEqual([1, 2, 3]);
    });

    it('first more than array length', function() {
        expect(u()
            .first(3)
            .process([1, 2])
        ).toEqual([1, 2])
    });

    it('first with object', function() {
        expect(u().first(3).process({a: 1, b: 2, c: 3, d: 4, e: 5, f: 6})).toEqual([1, 2, 3]);
    });

    it('first without parameter', function() {
        expect(u().first().process([1, 2, 3])).toBe(1);
    });

    it('first and index', function() {
        expect(u()
            .first(3)
            .map(function(x, i) {
                return i;
            })
            .process([1, 2, 3, 4, 5])
        ).toEqual([0, 1, 2]);
    });

    it('first and object index', function() {
        expect(u()
            .first(3)
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

    it('first and sortBy', function() {
        var array = [[3, 2, 1, 4]];
        var sorted = u().first().sortBy().process(array);
        expect(sorted).toEqual([1, 2, 3, 4]);
        expect(sorted).not.toBe(array[0]);
    });

    it('take is identical to first', function() {
        expect(u().take().process([1, 2, 3])).toBe(1);
    });

    it('head is identical to first', function() {
        expect(u().head().process([1, 2, 3])).toBe(1);
    });

    it('using first after map should use fixed array length', function() {
        expect(u()
            .map(function() {
            })
            .first(2)
            .fn()
            .toString()
        ).toContain('new Array');
    });

    it('using first twice should iterate until the smaller number', function() {
        expect(u('array')
            .first(2)
            .first(3)
            .fn()
            .toString()
        ).not.toContain('3');

        expect(u('array')
            .first(3)
            .first(2)
            .fn()
            .toString()
        ).not.toContain('3');
    });

    it('first and size', function() {
        expect(u()
            .first()
            .size()
            .process([{a: 1, b: 2}, {}, {}])
        ).toBe(2);
    });

    it('first 3 and size', function() {
        var fn = u()
            .first(3)
            .size()
            .fn();
        expect(fn([1, 2])).toBe(2);
        expect(fn([1, 2, 3, 4])).toBe(3);
    });

    it('first and initial', function() {
        expect(u()
            .first(2)
            .initial(2)
            .process([1, 2, 3])
        ).toEqual([]);
    });

    it('first and reduce', function() {
        expect(u()
            .first(2)
            .reduce(function(memo, x) {
                return memo + x;
            }, '')
            .process([1, 2, 3])
        ).toEqual('12');
    });

    it('first and reduceRight', function() {
        expect(u()
            .first(2)
            .reduceRight(function(memo, x) {
                return memo + x;
            }, '')
            .process([1, 2, 3])
        ).toEqual('21');
    });
});
var u = require('../../dist/main');

describe('rest tests', function() {
    it('Calling rest should exclude N elements at the beginning of the array.', function() {
        expect(u().rest(2).process([1, 2, 3, 4, 5, 6])).toEqual([3, 4, 5, 6]);
    });

    it('rest with object', function() {
        expect(u().rest(2).process({a: 1, b: 2, c: 3, d: 4, e: 5, f: 6})).toEqual([3, 4, 5, 6]);
    });

    it('rest without parameter', function() {
        expect(u().rest().process([1, 2, 3])).toEqual([2, 3]);
    });

    it('rest and index', function() {
        expect(u()
            .rest(2)
            .map(function(x, i) {
                return i;
            })
            .process([1, 2, 3, 4, 5])
        ).toEqual([0, 1, 2]);
    });

    it('rest and object index', function() {
        expect(u()
            .rest(2)
            .map(function(x, i) {
                return i;
            })
            .process({
                a: 1,
                b: 2,
                c: 3,
                d: 4
            })
        ).toEqual([0, 1]);
    });

    it('rest and index in previous step', function() {
        expect(u()
            .map(function(x, i) {
                return i;
            })
            .rest(3)
            .process([1, 2, 3, 4, 5])
        ).toEqual([3, 4]);
    });

    it('using rest after map should use fixed array length', function() {
        expect(u()
            .map(function() {
            })
            .rest(2)
            .fn()
            .toString()
        ).toContain('new Array');
    });

    it('using rest twice should be the same as calling rest with the sum', function() {
        expect(u('array')
            .rest(2)
            .rest(3)
            .fn()
            .toString()
        ).toBe(u('array').rest(5).fn().toString());
    });

    it('rest index bigger than array length', function() {
        expect(u()
            .rest(3)
            .process([1, 2])
        ).toEqual([]);
    });

    it('using rest after first', function() {
        expect(u()
            .first(2)
            .rest(1)
            .process([1, 2, 3])
        ).toEqual([2]);
    });

    it('using reduceRight after rest', function() {
        expect(u()
            .rest(2)
            .reduceRight(function(memo, x) {
                return memo + x;
            }, '')
            .process([1, 2, 3, 4, 5])
        ).toBe('543');
    });

    it('using size after rest', function() {
        var fn = u()
            .rest(2)
            .size()
            .fn();
        expect(fn([1, 2, 3, 4, 5])).toBe(3);
        expect(fn([1])).toBe(0);
    });

    it('rest alias', function() {
        expect(u().tail).toBe(u().rest);
        expect(u().drop).toBe(u().rest);
    });
});
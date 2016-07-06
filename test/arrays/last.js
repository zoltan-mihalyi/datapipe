var u = require('../../dist/main');

describe('last tests', function() {
    it('Calling last should work as expected.', function() {
        expect(u().last(2).process([1, 2, 3, 4, 5, 6])).toEqual([5, 6]);
    });

    it('last more than array length', function() {
        expect(u()
            .last(3)
            .process([1, 2])
        ).toEqual([1, 2])
    });

    it('last with map', function() {
        expect(u().last(2).process({a: 1, b: 2, c: 3, d: 4, e: 5, f: 6})).toEqual([5, 6]);
    });

    it('last without parameter', function() {
        expect(u().last().process([1, 2, 3])).toBe(3);
    });

    it('last with map and without parameter', function() {
        expect(u().last().process({a: 1, b: 2, c: 3})).toBe(3);
    });

    it('last without parameter should not use loop', function() {
        expect(u('array').last().fn().toString()).not.toContain('for');
    });

    it('last and index', function() {
        expect(u()
            .last(3)
            .map(function(x, i) {
                return i;
            })
            .process([1, 2, 3, 4, 5])
        ).toEqual([0, 1, 2]);
    });

    it('last and object index', function() {
        expect(u()
            .last(3)
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

    it('last and index in previous step', function() {
        expect(u()
            .map(function(x, i) {
                return i;
            })
            .last(3)
            .process([1, 2, 3, 4, 5])
        ).toEqual([2, 3, 4]);
    });

    it('last and sortBy', function() {
        var array = [[3, 2, 1, 4]];
        var sorted = u().last().sortBy().process(array);
        expect(sorted).toEqual([1, 2, 3, 4]);
        expect(sorted).not.toBe(array[0]);
    });

    it('using last after map should use fixed array length', function() {
        expect(u()
            .map(function() {
            })
            .last(2)
            .fn()
            .toString()
        ).toContain('new Array');
    });

    it('using last twice should iterate until the smaller number', function() {
        expect(u('array')
            .last(2)
            .last(3)
            .fn()
            .toString()
        ).not.toContain('3');
    });

    it('last and initial', function() {
        expect(u()
            .last(2)
            .initial(2)
            .process([1, 2, 3])
        ).toEqual([]);
    });

    it('last and rest', function() {
        expect(u()
            .last(3)
            .rest(2)
            .process([1, 2, 3, 4])
        ).toEqual([4]);
    });

    it('last, rest, last', function() {
        expect(u()
            .last(4)
            .rest(2)
            .last(3)
            .process([1, 2, 3, 4, 5])
        ).toEqual([4, 5]);
    });

    it('last and size', function() {
        expect(u()
            .last(2)
            .size()
            .process([1, 2, 3])
        ).toBe(2);

        expect(u()
            .last(4)
            .size()
            .process([1, 2, 3])
        ).toBe(3);
    });
});
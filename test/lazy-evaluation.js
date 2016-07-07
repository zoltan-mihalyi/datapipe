var u = require('../dist/main');

describe('Lazy evaluation', function() {
    it('map should do nothing if only length is needed', function() {
        var fn = u('array')
            .map(function(x) {
                return x;
            })
            .size()
            .fn();

        expect(fn.toString()).not.toContain('for');

        expect(fn([1, 2, 3])).toBe(3);
    });

    it('first should do nothing if only length is needed', function() {
        var fn = u('array')
            .first(3)
            .size()
            .fn();

        expect(fn.toString()).not.toContain('for');

        expect(fn([1, 2])).toBe(2);
        expect(fn([1, 2, 3, 4])).toBe(3);
    });

    it('filter should do nothing if only length is needed', function() {
        var fn = u('array')
            .filter(function(x) {
                return x % 2 === 0
            })
            .size()
            .fn();

        expect(fn.toString()).not.toContain('[]');

        expect(fn([1, 2, 3, 4, 5, 6])).toBe(3);
    });

    it('shuffle should do nothing if only length is needed', function() {
        var fn = u('array')
            .shuffle()
            .size()
            .fn();

        expect(fn.toString()).not.toContain('Array');

        expect(fn([1, 2, 3])).toBe(3);
    });

    it('empty steps caused by lazy evaluation should not use branches', function() {
        expect(u()
            .shuffle()
            .shuffle()
            .size()
            .fn()
            .toString()
        ).not.toContain('{}');
    });


    //todo flatten, groupBy
});
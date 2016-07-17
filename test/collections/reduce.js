var u = require('../../dist/main');

describe('reduce tests', function() {
    it('Calling reduce should work as expected.', function() {
        expect(u().reduce(function(memo, x) {
            return memo + x;
        }, '').process(['1', '2', '3', '4', '5'])).toBe('12345');
    });

    it('reduce with context', function() {
        expect(u().reduce(function(memo, x) {
            return memo + x + this.value;
        }, '', {value: '-'}).process(['1', '2', '3', '4', '5'])).toBe('1-2-3-4-5-');
    });

    it('Calling reduce with a non-primitive non-function object should fail', function() {
        expect(function() {
            u().reduce(function() {
            }, []);
        }).toThrow();
    });

    it('Calling reduce with a provider function', function() {
        var collect = u().reduce(function(memo, x) {
            memo.push(x);
            return memo;
        }, function() {
            return [];
        });

        expect(collect.process([1, 2, 3])).toEqual([1, 2, 3]);
        expect(collect.process([4, 5, 6])).toEqual([4, 5, 6]);
    });

    it('The result of reduce should be treaten as unknown', function() {
        expect(u()
            .reduce(function(memo, x, i) {
                memo[i] = x;
                return memo;
            }, function() {
                return {};
            })
            .sortBy()
            .process([3, 1, 2])
        ).toEqual([1, 2, 3]);

        expect(u()
            .reduce(function(memo, x) {
                memo.push(x);
                return memo;
            }, function() {
                return [];
            })
            .sortBy()
            .process([3, 1, 2])
        ).toEqual([1, 2, 3]);

        expect(u('map')
            .reduce(function() {
            }, '')
            .sortBy()
            .fn()
            .toString()
        ).toContain('++');

        expect(u('array')
            .reduce(function() {
            }, '')
            .sortBy()
            .fn()
            .toString()
        ).toContain(' in ');
    });

    it('reduce alias', function() {
        expect(u().inject).toBe(u().reduce);
        expect(u().foldl).toBe(u().reduce);
    });
});
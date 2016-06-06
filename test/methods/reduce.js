var dp = require('../../dist/datapipe');

describe('reduce tests', function() {
    it('Calling reduce should work as expected.', function() {
        expect(dp().reduce(function(memo, x) {
            return memo + x;
        }, '').process(['1', '2', '3', '4', '5'])).toBe('12345');
    });

    it('reduce with context', function() {
        expect(dp().reduce(function(memo, x) {
            return memo + x + this.value;
        }, '', {value: '-'}).process(['1', '2', '3', '4', '5'])).toBe('1-2-3-4-5-');
    });

    it('Calling reduce with a non-primitive non-function object should fail', function() {
        expect(function() {
            dp().reduce(function() {
            }, []);
        }).toThrow();
    });

    it('Calling reduce with a provider function', function() {
        var collect = dp().reduce(function(memo, x) {
            memo.push(x);
            return memo;
        }, function() {
            return [];
        });

        expect(collect.process([1, 2, 3])).toEqual([1, 2, 3]);
        expect(collect.process([4, 5, 6])).toEqual([4, 5, 6]);
    });
});
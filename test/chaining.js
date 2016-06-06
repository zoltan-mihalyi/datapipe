var dp = require('../dist/datapipe');

describe('Test functions with chaining', function() {
    it('map and filter', function() {
        expect(dp()
            .map(tenTimes)
            .filter(function(x) {
                return x % 20 === 0;
            })
            .process([1, 2, 3, 4])).toEqual([20, 40]);
    });

    it('map and each', function() {
        var result = [];
        dp()
            .map(tenTimes)
            .each(function(x) {
                result.push(x);
            })
            .process([1, 2, 3, 4]);

        expect(result).toEqual([10, 20, 30, 40]);
    });

    it('map and reduce', function() {
        expect(dp()
            .map(tenTimes)
            .reduce(function(memo, x) {
                return memo + x;
            }, '')
            .process([1, 2, 3, 4])).toEqual('10203040');
    });

    it('map and reduceRight', function() {
        expect(dp()
            .map(tenTimes)
            .reduceRight(function(memo, x) {
                return memo + x;
            }, '')
            .process([1, 2, 3, 4])).toEqual('40302010');
    });


    describe('Chaining with take', function() {

        it('map and take', function() {
            expect(dp()
                .map(tenTimes)
                .take(2)
                .process([1, 2, 3, 4])).toEqual([10, 20]);
        });

        it('filter and take', function() {
            expect(dp()
                .filter(function(x) {
                    return x % 2 === 0;
                })
                .take(2)
                .process([1, 2, 3, 4, 5, 6, 7])).toEqual([2, 4]);
        });

        it('filter, take, filter, take', function() {
            expect(dp()
                .filter(function(x) {
                    return x % 2 === 0;
                })
                .take(10)
                .filter(function(x) {
                    return x !== 4;
                })
                .take(2)
                .process([1, 2, 3, 4, 5, 6, 7, 8, 9])).toEqual([2, 6]);
        });

        it('filter, take, take', function() {
            expect(dp()
                .filter(function(x) {
                    return x % 2 === 0;
                })
                .take(3)
                .take(2)
                .process([1, 2, 3, 4, 5, 6, 7, 8, 9])).toEqual([2, 4]);
        });
    });

    it('sortBy twice', function() {
        expect(dp()
            .sortBy('y')
            .sortBy('x')
            .pluck('y')
            .process([{x: 2, y: 3}, {x: 1, y: 2}, {x: 3, y: 1}])
        ).toEqual([2, 3, 1])
    });
});

function tenTimes(x) {
    return x * 10;
}

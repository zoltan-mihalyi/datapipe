var dp = require('../../dist/datapipe');

describe('sortedIndex tests', function() {
    it('sortedIndex without iteratee', function() {
        expect(dp()
            .sortedIndex(3)
            .process([1, 2, 4, 5, 6])
        ).toBe(2);
    });

    it('sortedIndex with iteratee function', function() {
        expect(dp()
            .sortedIndex({x: 3}, function(obj) {
                return obj.x
            })
            .process([{x: 1}, {x: 2}, {x: 4}, {x: 5}, {x: 6}])
        ).toBe(2);
    });

    it('sortedIndex with iteratee function and context', function() {
        expect(dp()
            .sortedIndex({x: 3}, function(obj) {
                return obj[this.prop]
            }, {prop: 'x'})
            .process([{x: 1}, {x: 2}, {x: 4}, {x: 5}, {x: 6}])
        ).toBe(2);
    });

    it('sortedIndex with iteratee property', function() {
        expect(dp()
            .sortedIndex({x: 3}, 'x')
            .process([{x: 1}, {x: 2}, {x: 4}, {x: 5}, {x: 6}])
        ).toBe(2);
    });
});
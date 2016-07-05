var u = require('../../dist/main');

describe('reject tests', function() {
    it('Rejecting an array should return an array of the items NOT matching the predicate.', function() {
        expect(u().reject(function(x) {
            return x % 2 === 0;
        }).process([0, 1, 2, 3, 4, 5])).toEqual([1, 3, 5]);
    });

    it('reject with context', function() {
        expect(u().reject(function(x) {
            return x % 2 === this.value;
        }, {value: 0}).process([0, 1, 2, 3, 4, 5])).toEqual([1, 3, 5]);
    });

    it('reject with property', function() {
        expect(u()
            .reject('a')
            .process([{x: 1}, {a: 1}, {}, {a: 2}])
        ).toEqual([{x: 1}, {}]);
    });

    it('reject with properties', function() {
        expect(u()
            .reject({a: 1})
            .process([{x: 1}, {a: 1}, {}, {a: 2}])
        ).toEqual([{x: 1}, {}, {a: 2}]);
    });
});
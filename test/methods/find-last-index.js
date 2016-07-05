var u = require('../../dist/main');

describe('findLastIndex tests', function() {
    it('findLastIndex when item is present', function() {
        expect(u()
            .findLastIndex(function(obj) {
                return obj === 2;
            })
            .process([1, 2, 3, 4, 1, 2, 3, 4])
        ).toBe(5);
    });

    it('findLastIndex when item is not present', function() {
        expect(u()
            .findLastIndex(function(obj) {
                return obj === 4;
            })
            .process([1, 2, 3])
        ).toBe(-1);
    });

    it('findLastIndex with context', function() {
        expect(u()
            .findLastIndex(function(obj) {
                return obj === this.value;
            }, {value: 2})
            .process([1, 2, 3, 4, 1, 2, 3, 4])
        ).toBe(5);
    });

    it('findLastIndex with property', function() {
        expect(u()
            .findLastIndex('a')
            .process([{b: 1}, {a: 1}, {a: 3}, {b: 4}, {b: 1}, {a: 2}, {b: 3}, {b: 4}])
        ).toBe(5);
    });

    it('findLastIndex with properties', function() {
        expect(u()
            .findLastIndex({a: 2})
            .process([{a: 1}, {a: 2}, {a: 3}, {a: 4}, {a: 1}, {a: 2}, {a: 3}, {a: 4}])
        ).toBe(5);
    });

    it('findLastIndex without parameters', function() {
        expect(u()
            .findLastIndex()
            .process([1, false, true, 2, {}, 'a', null])
        ).toBe(5);
    });
});
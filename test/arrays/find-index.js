var u = require('../../dist/main');

describe('findIndex tests', function() {
    it('findIndex when item is present', function() {
        expect(u()
            .findIndex(function(obj) {
                return obj === 2;
            })
            .process([1, 2, 3, 4])
        ).toBe(1);
    });

    it('findIndex when item is not present', function() {
        expect(u()
            .findIndex(function(obj) {
                return obj === 4;
            })
            .process([1, 2, 3])
        ).toBe(-1);
    });

    it('findIndex with context', function() {
        expect(u()
            .findIndex(function(obj) {
                return obj === this.value;
            }, {value: 2})
            .process([1, 2, 3, 4])
        ).toBe(1);
    });

    it('findIndex with property', function() {
        expect(u()
            .findIndex('a')
            .process([{b: 1}, {a: 2}, {a: 3}, {a: 4}])
        ).toBe(1);
    });

    it('findIndex with properties', function() {
        expect(u()
            .findIndex({a: 2})
            .process([{a: 1}, {a: 2}, {a: 3}, {a: 4}])
        ).toBe(1);
    });

    it('findIndex with object', function() {
        expect(u()
            .findIndex(function(x) {
                return x === 2;
            })
            .process({
                'a': 1,
                'b': 2,
                'c': 3
            })
        ).toBe(-1);
    });

    it('findIndex with string', function() {
        expect(u()
            .findIndex(function(x) {
                return x === 'b';
            })
            .process('abc')
        ).toBe(1);
    });

    it('findIndex without parameter', function() {
        expect(u()
            .findIndex()
            .process([false, 0, 2, 'a'])
        ).toBe(2);
    });
});
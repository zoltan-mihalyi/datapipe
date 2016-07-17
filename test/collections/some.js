var u = require('../../dist/main');

describe('some tests', function() {

    it('some should return false if none of the elements match the predicate', function() {
        expect(u()
            .some(function(x) {
                return x % 2 === 0;
            })
            .process([1, 3, 5, 7])
        ).toBe(false);
    });

    it('some with context', function() {
        expect(u()
            .some(function(x) {
                return x % this.value === 0;
            }, {value: 2})
            .process([1, 3, 5, 7])
        ).toBe(false);
    });

    it('some with property', function() {
        expect(u()
            .some('b')
            .process([{a: 1}, {a: 1, b: 2}])
        ).toBe(true);
    });

    it('some with property and mismatch', function() {
        expect(u()
            .some('c')
            .process([{a: 1}, {b: 2}])
        ).toBe(false);
    });

    it('some without parameter', function() {
        expect(u()
            .some()
            .process([null, 1, 0, false])
        ).toBe(true);
    });

    it('some with properties with match', function() {
        expect(u()
            .some({a: 1})
            .process([{a: 2}, {}, {b: 1}, {a: 1}])
        ).toBe(true);
    });

    it('some with properties without match', function() {
        expect(u()
            .some({a: 0})
            .process([{a: 2}, {}, {b: 1}, {a: 1}])
        ).toBe(false);
    });

    it('some should return false on empty arrays', function() {
        expect(u()
            .some(function() {
                throw new Error('Predicate called on what?');
            })
            .process([])
        ).toBe(false);
    });

    it('some should return true if any of the elements match the predicate', function() {
        expect(u()
            .some(function(x) {
                return x % 2 === 0;
            })
            .process([1, 3, 4, 5])
        ).toBe(true);
    });

    it('some alias', function() {
        expect(u().any).toBe(u().some);
    });
});
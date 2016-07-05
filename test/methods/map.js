var u = require('../../dist/main');

describe('map tests', function() {
    it('Mapping an array should return an array with items mapped with the function.', function() {
        expect(u()
            .map(function(x) {
                return x + 1;
            })
            .process([-1, 0, 1])
        ).toEqual([0, 1, 2]);
    });

    it('map with context', function() {
        expect(u()
            .map(function(x) {
                return x + this.value;
            }, {value: 1})
            .process([-1, 0, 1])
        ).toEqual([0, 1, 2]);
    });

    it('map with null', function() {
        expect(u()
            .map(null)
            .process([1, 2, 3])
        ).toEqual([1, 2, 3]);
    });

    it('map with property', function() {
        expect(u()
            .map('a')
            .process([{a: 0}, {a: 1}, {a: 2}])
        ).toEqual([0, 1, 2]);
    });

    it('map with properties', function() {
        expect(u()
            .map({a: 1})
            .process([{a: 0}, {a: 1}, {a: 2}])
        ).toEqual([false, true, false]);
    });

    it('mapping an array should use fixed length array', function() {
        expect(u()
            .map(function(x) {
            })
            .fn()
            .toString()
        ).toContain('new Array');
    });
});
var u = require('../../dist/main');

describe('Test "find"', function() {
    it('Calling find should return the first item in the array matching the predicate.', function() {
        expect(u().find(function(x) {
            return x % 3 === 0;
        }).process([1, 2, 3, 4, 5, 6])).toBe(3);
    });

    it('find with context', function() {
        expect(u().find(function(x) {
            return x % this.value === 0;
        }, {value: 3}).process([1, 2, 3, 4, 5, 6])).toBe(3);
    });

    it('Calling find should return undefined when no items in the array are matching the predicate.', function() {
        expect(u().find(function(x) {
            return x % 4 === 0;
        }).process([1, 2, 3])).toBeUndefined()
    });

    it('find property', function() {
        expect(u()
            .find('a')
            .process([{x: 1}, {a: 1}, {a: 2}, {x: 2}])
        ).toEqual({a: 1});
    });

    it('find properties', function() {
        expect(u()
            .find({a: 1})
            .process([{x: 1}, {a: 1}, {a: 2}, {a: 1}])
        ).toEqual({a: 1});
    });

    it('find without parameter', function() {
        expect(u()
            .find()
            .process([null, 0, void 0, '', 1])
        ).toEqual(1);
    });

    it('find and sortBy', function() {
        var array = [[2, 1]];
        var result = u()
            .find(function() {
                return true;
            })
            .sortBy()
            .process(array);
        expect(result).not.toBe(array[0]);
        expect(result).toEqual([1, 2]);
    });

    it('find alias', function() {
        expect(u().detect).toBe(u().find);
    });
});
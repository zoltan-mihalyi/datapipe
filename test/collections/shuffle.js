var u = require('../../dist/main');

describe('shuffle tests', function() {
    var array = [1, 2, 3, 4, 5, 6];

    it('shuffled array has the same items', function() {
        expect(u()
            .shuffle()
            .process(array)
            .sort()
        ).toEqual(array);
    });

    it('shuffle should work with array hint', function() {
        var shuffled = u('array')
            .shuffle()
            .process(array);
        expect(shuffled.sort()).toEqual(array);
    });

    it('shuffle should work after filter', function() {
        var shuffled = u('array')
            .filter(function(x, i) {
                return i % 2 === 0;
            })
            .shuffle()
            .process(array);
        expect(shuffled.sort()).toEqual([1, 3, 5]);
    });

    it('shuffled array is not the same reference as the original.', function() {
        expect(u()
            .shuffle()
            .process(array)
        ).not.toBe(array);
    });

    it('shuffle object', function() {
        expect(u()
            .shuffle()
            .process({a: 1, b: 2, c: 3})
            .sort()
        ).toEqual([1, 2, 3]);
    });
});

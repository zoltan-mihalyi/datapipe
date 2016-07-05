var u = require('../dist/main');

describe('Data type hints', function() {
    describe('Giving hint of data type causes shorter functions to be generated, and the shorter function produces the same result.', function() {
        var pluckX = u()
            .pluck('x')
            .fn();

        it('array hint', function() {
            var pluckXArray = u('array')
                .pluck('x')
                .fn();
            expect(pluckXArray.toString().length)
                .toBeLessThan(pluckX.toString().length);

            expect(pluckXArray([{x: 1}, {x: 2}]))
                .toEqual([1, 2]);
        });

        it('object hint', function() {
            var pluckXObject = u('object')
                .pluck('x')
                .fn();

            expect(pluckXObject.toString().length)
                .toBeLessThan(pluckX.toString().length);

            expect(pluckXObject({
                a: {x: 1},
                b: {x: 2}
            })).toEqual([1, 2]);
        });
    });

    it('array hint when using arrayIndex', function() {
        expect(u('array')
            .take(2)
            .pluck('x')
            .process([{x: 1}, {x: 3}, {x: 2}])
        ).toEqual([1, 3]);
    });

    it('When the previous step creates an array, the next step should not contain the object iteration, but should work.', function() {
        var sortAndPluck = u('array')
            .sortBy('x')
            .pluck('y')
            .fn();

        expect(sortAndPluck.toString()).not.toContain(' in ');

        expect(sortAndPluck([{x: 2, y: 3}, {x: 1, y: 4}]))
            .toEqual([4, 3]);
    });

    //todo slice,sort,etc. with array-like objects!!!
});

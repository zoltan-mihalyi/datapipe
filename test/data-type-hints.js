var dp = require('../dist/datapipe');

describe('Data type hints', function() {
    describe('Giving hint of data type causes shorter functions to be generated, and the shorter function produces the same result.', function() {
        var pluckX = dp()
            .pluck('x')
            .fn();

        it('array hint', function() {
            var pluckXArray = dp('array')
                .pluck('x')
                .fn();
            expect(pluckXArray.toString().length)
                .toBeLessThan(pluckX.toString().length);

            expect(pluckXArray([{x: 1}, {x: 2}]))
                .toEqual([1, 2]);
        });

        it('object hint', function() {
            var pluckXObject = dp('object')
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
        expect(dp('array')
            .take(2)
            .pluck('x')
            .process([{x: 1}, {x: 3}, {x: 2}])
        ).toEqual([1, 3]);
    });

    it('When the previous step creates an array, the next step should not contain the object iteration, but should work.', function() {
        var sortAndPluck = dp('array')
            .sortBy('x')
            .pluck('y')
            .fn();

        expect(sortAndPluck.toString()).not.toContain(' in ');

        expect(sortAndPluck([{x: 2, y: 3}, {x: 1, y: 4}]))
            .toEqual([4, 3]);
    });

    it('Empty map should be replaced by slice().', function() {
        var sorter = dp()
            .sortBy()
            .fn()
            .toString();
        expect(sorter).not.toContain('++i');
        expect(sorter).toContain('slice');
    });

    //todo slice,sort,etc. with array-like objects!!!
});

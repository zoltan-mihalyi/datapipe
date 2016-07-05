var dp = require('../../dist/datapipe');

describe('intersection tests', function() {
    it('the result of intersection should contain element from the array if it is contained at least in one of the target arrays.', function() {
        expect(dp()
            .intersection([1, 2, 1, 3], [1, 3, 4])
            .process([1, 2, 2, 3, 4, 3, 5])
        ).toEqual([1, 3]);
    });

    it('intersection with object', function() {
        expect(dp()
            .intersection([1, 3, 5])
            .process({
                a: 1,
                b: 2,
                c: 3,
                d: 4
            })
        ).toEqual([1, 3])
    });

    it('intersection without parameters', function() {
        expect(dp()
            .intersection()
            .process([1, 2, 1, 3])
        ).toEqual([1, 2, 3]);
    });

    it('intersection with empty array', function() {
        expect(dp()
            .intersection([])
            .process([1, 2, 1, 3])
        ).toEqual([]);
    });

    it('intersection and size', function() {
        expect(dp()
            .intersection([])
            .size()
            .process([1, 2, 1, 3])
        ).toEqual(0);
    });
});
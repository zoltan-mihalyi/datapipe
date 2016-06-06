var dp = require('../../dist/datapipe');

describe('flatten tests', function() {
    it('should flatten the array', function() {
        expect(dp()
            .flatten(true)
            .process([[1, 2], [3, [4]]])
        ).toEqual([1, 2, 3, [4]]);
    });

    it('flatten should work with non-array values', function() {
        expect(dp()
            .flatten()
            .process([1, 2, [3, 4]])
        ).toEqual([1, 2, 3, 4]);

        expect(dp()
            .flatten(true)
            .process([1, 2, [3, 4]])
        ).toEqual([1, 2, 3, 4]);
    });

    it('flatten should work deep when the first parameter is not true', function() {
        expect(dp()
            .flatten()
            .process([1, 2, [3, [4]]])
        ).toEqual([1, 2, 3, 4]);
    });
});
var dp = require('../../dist/datapipe');

describe('difference tests', function() {
    it('difference should exclude the items of the parameter arrays from the array.', function() {
        var obj = {};
        var obj2 = {};
        expect(dp()
            .difference([1, 1, 3], [2, 3, obj])
            .process([1, 2, 3, 4, 5, 6, obj, obj2])
        ).toEqual([4, 5, 6, obj2]);
    });
});
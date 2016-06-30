var dp = require('../../dist/datapipe');

describe('without tests', function() {
    it('without should exclude the parameters from the array.', function() {
        var obj = {};
        var obj2 = {};

        expect(dp()
            .without(1, 3, 5, obj)
            .process([1, 2, 3, 4, 5, 6, obj, obj2])
        ).toEqual([2, 4, 6, obj2]);
    });
});
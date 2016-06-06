var dp = require('../../dist/datapipe');

describe('shuffle tests', function() {
    var array = [1, 2, 3, 4, 5, 6];
    it('shuffled array has the same items', function() {

        var shuffled = dp()
            .shuffle()
            .process(array);

        expect(shuffled.sort()).toEqual(array);
    });

    it('shuffled array is not the same reference as the original.', function() {
        expect(dp()
            .shuffle()
            .process(array)
        ).not.toBe(array);
    });
});

var dp = require('../../dist/datapipe');

describe('union tests', function() {

    it('union should include the items not included in the array', function() {
        var obj = {};
        var obj2 = {};

        expect(dp()
            .union([1, 3], [4, obj, obj2])
            .process([1, 2, obj])
        ).toEqual([1, 2, obj, 3, 4, obj2]);
    });

    it('union with map', function() {
        expect(dp()
            .union([1, 3])
            .process({a: 1, b: 2})
        ).toEqual([1, 2, 3]);
    });

    it('union should not change the original array', function() {
        var arr = [1, 2];

        expect(dp()
            .union([3])
            .process(arr)
        ).toEqual([1, 2, 3]);

        expect(arr.length).not.toBe(3);
    });
});
var u = require('../../dist/main');

describe('union tests', function() {

    it('union should include the items not included in the array', function() {
        var obj = {};
        var obj2 = {};

        expect(u()
            .union([1, 3], [3, 4, obj, obj2])
            .process([1, 2, obj])
        ).toEqual([1, 2, obj, 3, 4, obj2]);
    });

    it('union should filter the duplicates in the array', function() {
        expect(u()
            .union([1, 2, 3])
            .process([1, 2, 2])
        ).toEqual([1, 2, 3]);
    });

    it('union with no params', function() {
        expect(u()
            .union()
            .process([1, 2, 2])
        ).toEqual([1, 2]);
    });

    it('union with map', function() {
        expect(u()
            .union([1, 3])
            .process({a: 1, b: 2})
        ).toEqual([1, 2, 3]);
    });

    it('union should not change the original array', function() {
        var arr = [1, 2];

        expect(u()
            .union([3])
            .process(arr)
        ).toEqual([1, 2, 3]);

        expect(arr.length).not.toBe(3);
    });

    it('union array', function() {
        expect(u('array')
            .union([2])
            .process([1])
        ).toEqual([1, 2]);
    });


    it('union after map', function() {
        expect(u('array')
            .map(function(x) {
                return x - 1;
            })
            .union([2])
            .process([2])
        ).toEqual([1, 2]);
    });


});
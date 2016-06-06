var dp = require('../../dist/datapipe');

describe('toArray tests', function() {
    var array = [1, 2, 3];

    it('toArray should create a copy of the original array', function() {
        var result = dp()
            .toArray()
            .process(array);

        expect(result).not.toBe(array);
        expect(result).toEqual(array);
    });

    it('toArray should work on objects', function() {
        var result = dp()
            .toArray()
            .process({a: 1, b: 2, c: 3});

        expect(result).toEqual([1, 2, 3]);
    });
});
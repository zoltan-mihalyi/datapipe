var u = require('../../dist/main');

describe('values tests', function() {
    it('values of object is an array of values', function() {
        expect(u()
            .values()
            .process({a: 1, b: 2})
        ).toEqual([1, 2]);
    });

    it('values of array', function() {
        expect(u()
            .values()
            .process([1, 2])
        ).toEqual([1, 2]);
    });

    it('values of null', function() {
        expect(u()
            .values()
            .process(null)
        ).toEqual([]);
    });

    it('values of number', function() {
        expect(u()
            .values()
            .process(1)
        ).toEqual([]);
    });

    it('values of string', function() {
        expect(u()
            .values()
            .process('abc')
        ).toEqual([]);
    });
});
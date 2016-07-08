var u = require('../../dist/main');

describe('pairs tests', function() {
    it('default behavior', function() {
        expect(u()
            .pairs()
            .process({a: 1, b: 2})
        ).toEqual([['a', 1], ['b', 2]]);
    });

    it('array pairs', function() {
        expect(u()
            .pairs()
            .process([1, 2])
        ).toEqual([['0', 1], ['1', 2]]);
    });

    it('array with extra properties pairs', function() {
        var array = [1, 2];
        array.x = 3;
        expect(u()
            .pairs()
            .process(array)
        ).toEqual([['0', 1], ['1', 2], ['x', 3]]);
    });
});
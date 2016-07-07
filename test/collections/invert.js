var u = require('../../dist/main');

describe('invert tests', function() {
    it('invert object', function() {
        expect(u()
            .invert()
            .process({a: 1, b: 2})
        ).toEqual({1: 'a', 2: 'b'});
    });

    it('invert array', function() {
        expect(u()
            .invert()
            .process([1, 2, 3])
        ).toEqual({1: '0', 2: '1', 3: '2'});
    });

    it('duplicated values', function() {
        expect(u()
            .invert()
            .process({a: 1, b: 2, c: 2})
        ).toEqual({1: 'a', 2: 'c'});
    });
});
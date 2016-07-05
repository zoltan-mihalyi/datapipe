var u = require('../../dist/main');

describe('indexOf tests', function() {
    it('indexOf when item is present', function() {
        expect(u()
            .indexOf(2)
            .process([1, 2, 3, 4, 1, 2, 3, 4])
        ).toBe(1);
    });

    it('indexOf when item is not present', function() {
        expect(u()
            .indexOf(4)
            .process([1, 2, 3])
        ).toBe(-1);
    });

    it('indexOf with object', function() {
        expect(u()
            .indexOf(3)
            .process({
                'a': 1,
                'b': 2,
                'c': 3,
                'd': 4
            })
        ).toBe('c');
    });

    it('indexOf sorted', function() {
        expect(u()
            .indexOf(9, true)
            .process([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
        ).toBe(8);
    });
});
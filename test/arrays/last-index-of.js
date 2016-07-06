var u = require('../../dist/main');

describe('lastIndexOf tests', function() {
    it('indexOf when item is present', function() {
        expect(u()
            .lastIndexOf(2)
            .process([1, 2, 3, 4, 1, 2, 3, 4])
        ).toBe(5);
    });

    it('lastIndexOf when item is not present', function() {
        expect(u()
            .lastIndexOf(4)
            .process([1, 2, 3])
        ).toBe(-1);
    });

    it('lastIndexOf with fromIndex', function() {
        expect(u()
            .lastIndexOf(2, 6)
            .process([1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4])
        ).toBe(5);
    });
});
var u = require('../../dist/main');

describe('contains tests', function() {
    it('Calling contains on an array which contains the item should return true.', function() {
        expect(u()
            .contains(1)
            .process([0, 1, 2])
        ).toBe(true);
    });

    it('Calling contains on an array which does not contain the item should return false.', function() {
        expect(u()
            .contains(3)
            .process([0, 1, 2])
        ).toBe(false);
    });

    it('Calling contains on an empty array should return false.', function() {
        expect(u()
            .contains(1)
            .process([])
        ).toBe(false);
    });

    it('contains alias', function() {
        expect(u().includes).toBe(u().contains);
    });
});
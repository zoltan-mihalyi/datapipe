var dp = require('../../dist/datapipe');

describe('contains tests', function() {
    it('Calling contains on an array which contains the item should return true.', function() {
        expect(dp()
            .contains(1)
            .process([0, 1, 2])
        ).toBe(true);
    });

    it('Calling contains on an array which does not contain the item should return false.', function() {
        expect(dp()
            .contains(3)
            .process([0, 1, 2])
        ).toBe(false);
    });

    it('Calling contains on an empty array should return false.', function() {
        expect(dp()
            .contains(1)
            .process([])
        ).toBe(false);
    });
});
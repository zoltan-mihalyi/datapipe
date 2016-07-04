var dp = require('../../dist/datapipe');

describe('indexOf tests', function() {
    it('indexOf when item is present', function() {
        expect(dp()
            .indexOf(2)
            .process([1, 2, 3, 4])
        ).toBe(1);
    });

    it('indexOf when item is not present', function() {
        expect(dp()
            .indexOf(4)
            .process([1, 2, 3])
        ).toBe(-1);
    });
});
var dp = require('../../dist/datapipe');

describe('take tests', function() {
    it('Calling take should work as expected.', function() {
        expect(dp().take(3).process([1, 2, 3, 4, 5, 6])).toEqual([1, 2, 3]);
    });

    it('take with object', function() {
        expect(dp().take(3).process({a: 1, b: 2, c: 3, d: 4, e: 5, f: 6})).toEqual([1, 2, 3]);
    });
});
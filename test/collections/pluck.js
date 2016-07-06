var u = require('../../dist/main');

describe('pluck tests', function() {
    it('pluck should work as expected, even with null-like values', function() {
        expect(u()
            .pluck('x')
            .process([{x: 0}, {}, null])
        ).toEqual([0, void 0, void 0]);
    });
});
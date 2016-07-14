var u = require('../../dist/main');

describe('property tests', function() {
    it('basic property usage', function() {
        var getter = u()
            .property()
            .process('a');

        expect(getter({a: 1, b: 1, c: 3})).toBe(1);
        expect(getter({})).toBeUndefined();
        expect(getter(null)).toBeUndefined()
    });
});
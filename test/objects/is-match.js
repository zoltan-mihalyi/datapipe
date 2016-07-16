var u = require('../../dist/main');

describe('isMatch tests', function() {
    it('object matcher', function() {
        var matcher = u()
            .isMatch({a: 1, b: '2'})
            .fn();

        expect(matcher({a: 1, b: '2'})).toBe(true);
        expect(matcher({a: 1, c: 1, b: '2'})).toBe(true);
        expect(matcher({a: 1})).toBe(false);
        expect(matcher({a: 1, b: 2})).toBe(false);
    });
});
var u = require('../../dist/main');

describe('propertyOf tests', function() {
    it('basic propertyOf usage', function() {
        var getProp = u()
            .propertyOf()
            .process({a: 1});

        expect(getProp('a')).toBe(1);
        expect(getProp('b')).toBeUndefined();
    });

    it('propertyOf null value', function() {
        var getProp = u()
            .propertyOf()
            .process(null);

        expect(getProp('a')).toBeUndefined();
    });
});
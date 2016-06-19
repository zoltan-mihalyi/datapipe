var dp = require('../../dist/datapipe');

describe('size tests', function() {
    it('array size', function() {
        expect(dp().size().process([1, 2, 3])).toEqual(3);
    });

    it('object size', function() {
        expect(dp().size().process({a: 1, b: 2, c: 3})).toEqual(3);
    });

    it('size should not use iteration to determine array size', function() {
        expect(dp()
            .size()
            .fn()
            .toString()
        ).not.toContain('<');
    });
});
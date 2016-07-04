var dp = require('../../dist/datapipe');

describe('object tests', function() {
    it('object without parameter', function() {
        expect(dp()
            .object()
            .process([['a', 1], ['b', 2], ['c', 3]])
        ).toEqual({
            a: 1,
            b: 2,
            c: 3
        });
    });

    it('object with parameter', function() {
        expect(dp()
            .object([1, 2, 3])
            .process(['a', 'b', 'c'])
        ).toEqual({
            a: 1,
            b: 2,
            c: 3
        });
    });
});
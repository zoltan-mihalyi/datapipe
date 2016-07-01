var dp = require('../../dist/datapipe');

describe('uniq tests', function() {
    it('uniq should filter the duplicates', function() {
        expect(dp()
            .uniq()
            .process([1, 2, 2, 3, 4, 3])
        ).toEqual([1, 2, 3, 4]);
    });
    it('uniq with object', function() {
        expect(dp()
            .uniq()
            .process({
                a: 1,
                b: 1,
                c: 2,
                d: 3,
                e: 2,
                f: 4
            })
        ).toEqual([1, 2, 3, 4]);
    });
});
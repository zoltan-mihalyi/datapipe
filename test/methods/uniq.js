var u = require('../../dist/main');

describe('uniq tests', function() {
    it('uniq should filter the duplicates', function() {
        expect(u()
            .uniq()
            .process([1, 2, 2, 3, 4, 3])
        ).toEqual([1, 2, 3, 4]);
    });
    it('uniq with object', function() {
        expect(u()
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
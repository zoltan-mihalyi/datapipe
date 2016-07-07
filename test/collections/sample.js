var u = require('../../dist/main');

describe('sample tests', function() {
    var array = [1, 2, 3, 4, 5, 6];

    it('empty array sample', function() {
        expect(u()
            .sample()
            .process([])
        ).toBeUndefined();
    });

    it('array should contain the sample', function() {
        expect(array.indexOf(u()
            .sample()
            .process(array)
        )).not.toBe(-1);
    });

    it('sampled items size', function() {
        expect(u()
            .sample(4)
            .size()
            .process(array)
        ).toBe(4);
    });

    it('sampled items should be unique', function() {
        expect(u()
            .sample(4)
            .uniq()
            .size()
            .process(array)
        ).toBe(4);
    });

    it('sampled items should be contained in the array', function() {
        expect(u()
            .sample(4)
            .intersection(array)
            .size()
            .process(array)
        ).toBe(4);
    });

    it('sample more items than array length', function() {
        expect(u()
            .sample(10)
            .sortBy()
            .process(array)
        ).toEqual(array);
    });

    it('sample object', function() {
        expect(array.indexOf(u()
            .sample()
            .process({a: 1, b: 2, c: 3})
        )).not.toBe(-1);
    });

    it('sample items object', function() {
        expect(u()
            .sample(2)
            .intersection([1, 2, 3])
            .size()
            .process({a: 1, b: 2, c: 3})
        ).toBe(2);
    });
});

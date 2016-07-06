var u = require('../../dist/main');

describe('zip tests', function() {
    it('zip simple case', function() {
        expect(u()
            .zip([true, false, true, false], ['a', 'b', 'c', 'd'])
            .process([1, 2, 3, 4])
        ).toEqual([
            [1, true, 'a'],
            [2, false, 'b'],
            [3, true, 'c'],
            [4, false, 'd']
        ]);
    });

    it('zip variable length', function() {
        expect(u()
            .zip([true, false], ['a', 'b', 'c'])
            .process([1, 2, 3, 4])
        ).toEqual([
            [1, true, 'a'],
            [2, false, 'b'],
            [3, void 0, 'c'],
            [4, void 0, void 0]
        ]);
    });
});
var dp = require('../../dist/datapipe');

describe('unzip tests', function() {
    it('unzip simple case', function() {
        expect(dp()
            .unzip()
            .process([[1, 'a'], [2, 'b'], [3, 'c']])
        ).toEqual([[1, 2, 3], ['a', 'b', 'c']]);
    });

    it('unzip with different lengths', function() {
        expect(dp()
            .unzip()
            .process([[1, 'a', true], [2], [3, 'c']])
        ).toEqual([[1, 2, 3], ['a', void 0, 'c'], [true, void 0, void 0]]);
    });
});
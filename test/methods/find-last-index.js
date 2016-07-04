var dp = require('../../dist/datapipe');

describe('findLastIndex tests', function() {
    it('findLastIndex when item is present', function() {
        expect(dp()
            .findLastIndex(function(obj) {
                return obj === 2;
            })
            .process([1, 2, 3, 4, 1, 2, 3, 4])
        ).toBe(5);
    });

    it('findLastIndex when item is not present', function() {
        expect(dp()
            .findLastIndex(function(obj) {
                return obj === 4;
            })
            .process([1, 2, 3])
        ).toBe(-1);
    });

    it('findLastIndex with context', function() {
        expect(dp()
            .findLastIndex(function(obj) {
                return obj === this.value;
            }, {value: 2})
            .process([1, 2, 3, 4, 1, 2, 3, 4])
        ).toBe(5);
    });
});
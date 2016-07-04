var dp = require('../../dist/datapipe');

describe('findIndex tests', function() {
    it('findIndex when item is present', function() {
        expect(dp()
            .findIndex(function(obj) {
                return obj === 2;
            })
            .process([1, 2, 3, 4])
        ).toBe(1);
    });

    it('findIndex when item is not present', function() {
        expect(dp()
            .findIndex(function(obj) {
                return obj === 4;
            })
            .process([1, 2, 3])
        ).toBe(-1);
    });

    it('findIndex with context', function() {
        expect(dp()
            .findIndex(function(obj) {
                return obj === this.value;
            }, {value: 2})
            .process([1, 2, 3, 4])
        ).toBe(1);
    });

    it('findIndex with object', function() {
        expect(dp()
            .findIndex(function(x) {
                return x === 3;
            })
            .process({
                'a': 1,
                'b': 2,
                'c': 3,
                'd': 4
            })
        ).toBe('c');
    });
});
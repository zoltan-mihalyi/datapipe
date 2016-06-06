var dp = require('../../dist/datapipe');

describe('map tests', function() {
    it('Mapping an array should return an array with items mapped with the function.', function() {
        expect(dp().map(function(x) {
            return x + 1;
        }).process([-1, 0, 1])).toEqual([0, 1, 2]);
    });

    it('map with context', function() {
        expect(dp().map(function(x) {
            return x + this.value;
        }, {value: 1}).process([-1, 0, 1])).toEqual([0, 1, 2]);
    });
});
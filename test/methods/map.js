var u = require('../../dist/main');

describe('map tests', function() {
    it('Mapping an array should return an array with items mapped with the function.', function() {
        expect(u().map(function(x) {
            return x + 1;
        }).process([-1, 0, 1])).toEqual([0, 1, 2]);
    });

    it('map with context', function() {
        expect(u().map(function(x) {
            return x + this.value;
        }, {value: 1}).process([-1, 0, 1])).toEqual([0, 1, 2]);
    });

    it('mapping an array should use fixed length array', function() {
        expect(u()
            .map(function(x) {
            })
            .fn()
            .toString()
        ).toContain('new Array');
    });
});
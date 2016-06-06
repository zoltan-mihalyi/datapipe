var dp = require('../../dist/datapipe');

describe('each tests', function() {
    it('Iterating over an array with "each" causes the function to be called with the items of the array as parameter.', function() {
        var res = [];
        dp().each(function(x) {
            res.push(x);
        }).process([0, 1, 2]);
        expect(res).toEqual([0, 1, 2]);
    });

    it('each with context', function() {
        var res = [];
        dp().each(function(x) {
            this.push(x);
        }, res).process([0, 1, 2]);
        expect(res).toEqual([0, 1, 2]);
    });

    it('each should not create a new array', function() {
        var arr = [1, 2, 3];
        expect(dp()
            .each(function() {
            })
            .process(arr)
        ).toBe(arr);
    });
});
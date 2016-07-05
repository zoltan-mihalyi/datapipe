var u = require('../../dist/main');

describe('partition tests', function() {
    it('simple partition', function() {
        expect(u()
            .partition(function(x) {
                return x % 2 === 0;
            })
            .process([1, 2, 3, 4, 5])
        ).toEqual([[2, 4], [1, 3, 5]]);
    });
});
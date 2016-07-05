var u = require('../../dist/main');

describe('where tests', function() {
    it('Calling where should work as expected.', function() {
        expect(u()
            .where({x: 1})
            .process([{x: 1}, {x: 2, y: 3}, {x: 1, y: 4}])
        ).toEqual([{x: 1}, {x: 1, y: 4}]);
    });
});
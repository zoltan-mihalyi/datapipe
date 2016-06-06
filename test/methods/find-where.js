var dp = require('../../dist/datapipe');
describe('findWhere tests', function() {
    it('Calling findWhere when there are matching objects', function() {
        expect(dp().findWhere({x: 1}).process([{x: 2}, {x: 1, y: 3}, {x: 1, y: 4}])).toEqual({x: 1, y: 3});

    });
    it('Calling findWhere when there are no matching objects', function() {
        expect(dp().findWhere({x: 1}).process([{x: 2}, {x: 2, y: 3}])).toBeUndefined();

    });
});
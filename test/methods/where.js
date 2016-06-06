var dp = require('../../dist/datapipe');

describe('where tests', function() {
    it('Calling where should work as expected.', function() {
        expect(dp().where({x: 1}).process([{x: 1}, {x: 2, y: 3}, {x: 1, y: 4}])).toEqual([{x: 1}, {x: 1, y: 4}]);
    });

    it('special property names', function() {
        var properties = {'\'\n\r\\': 1};
        expect(dp().where(properties).process([{'\'\n\r\\': 1}]).length).toEqual(1);
        expect(dp().where(properties).process([{'\'\n\r\\': 2}]).length).toEqual(0);
    });

    it('where filter should not consider prototype properties', function() {
        function Props() {
        }

        Props.prototype.x = 1;

        var properties = new Props();
        properties.y = 2;
        expect(dp()
            .where(properties)
            .process([{x: 1, y: 2}, {x: 2, y: 2}, {x: 1, y: 1}, {x: 2, y: 1}])
        ).toEqual([{x: 1, y: 2}, {x: 2, y: 2}]);
    });
});
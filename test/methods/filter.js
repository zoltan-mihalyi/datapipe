var u = require('../../dist/main');

describe('filter tests', function() {
    it('Filtering an array should return an array of the items matching the predicate.', function() {
        expect(u().filter(function(x) {
            return x % 2 === 0;
        }).process([0, 1, 2, 3, 4])).toEqual([0, 2, 4]);
    });

    it('filter with context', function() {
        expect(u().filter(function(x) {
            return x % 2 === this.value;
        }, {value: 0}).process([0, 1, 2, 3, 4])).toEqual([0, 2, 4]);
    });

    it('filter properties', function() {
        expect(u()
            .filter({x: 1})
            .process([{x: 1}, {x: 2, y: 3}, {x: 1, y: 4}])
        ).toEqual([{x: 1}, {x: 1, y: 4}]);
    });

    it('filter property', function() {
        expect(u()
            .filter('y')
            .process([{x: 1}, {x: 2, y: 3}, {x: 1, y: 4}])
        ).toEqual([{x: 2, y: 3}, {x: 1, y: 4}]);
    });

    it('filter with special property names', function() {
        var properties = {'\'\n\r\\': 1};
        expect(u().filter(properties).process([{'\'\n\r\\': 1}]).length).toEqual(1);
        expect(u().filter(properties).process([{'\'\n\r\\': 2}]).length).toEqual(0);
    });

    it('filter should not consider prototype properties', function() {
        function Props() {
        }

        Props.prototype.x = 1;

        var properties = new Props();
        properties.y = 2;
        expect(u()
            .filter(properties)
            .process([{x: 1, y: 2}, {x: 2, y: 2}, {x: 1, y: 1}, {x: 2, y: 1}])
        ).toEqual([{x: 1, y: 2}, {x: 2, y: 2}]);
    });
});
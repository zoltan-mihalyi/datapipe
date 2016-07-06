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

    it('filter properties with null values', function() {
        expect(u()
            .filter({x: 1})
            .process([null, void 0, 0, false])
        ).toEqual([]);
    });

    it('filter properties with null values and empty filter', function() {
        expect(u()
            .filter({})
            .process([null, void 0, 0, false, 'a'])
        ).toEqual([null, void 0, 0, false, 'a']);
    });

    it('filter properties with primitive properties', function() {
        expect(u()
            .filter({hasOwnProperty: Object.prototype.hasOwnProperty})
            .process([null, void 0, 0, false, 'a'])
        ).toEqual([0, false, 'a']);
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

    it('filter without parameter', function() {
        expect(u()
            .filter()
            .process([0, 1, 2, 'a', true, false, null, void 0, {}])
        ).toEqual([1, 2, 'a', true, {}]);
    })
});
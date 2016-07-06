var u = require('../../dist/main');
describe('findWhere tests', function() {
    it('Calling findWhere when there are matching objects', function() {
        expect(u()
            .findWhere({x: 1})
            .process([{x: 2}, {x: 1, y: 3}, {x: 1, y: 4}])
        ).toEqual({x: 1, y: 3});
    });

    it('Calling findWhere when there are no matching objects', function() {
        expect(u().findWhere({x: 1}).process([{x: 2}, {x: 2, y: 3}])).toBeUndefined();
    });

    it('Calling findWhere with empty properties', function() {
        expect(u()
            .findWhere({})
            .process([{x: 2}, {x: 2, y: 3}])
        ).toEqual({x: 2});
    });

    it('Calling findWhere with string', function() {
        expect(u()
            .findWhere('a')
            .process([null, {x: 2}])
        ).toBe(null);
    });

    it('Calling findWhere with number', function() {
        expect(u()
            .findWhere(42)
            .process([false, {x: 2}])
        ).toBe(false);
    });

    it('Calling findWhere without parameter', function() {
        expect(u()
            .findWhere()
            .process([0, {x: 2}])
        ).toBe(0);
    });
});
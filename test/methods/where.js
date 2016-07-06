var u = require('../../dist/main');

describe('where tests', function() {
    it('Calling where should work as expected.', function() {
        expect(u()
            .where({x: 1})
            .process([{x: 1}, {x: 2, y: 3}, {x: 1, y: 4}])
        ).toEqual([{x: 1}, {x: 1, y: 4}]);
    });

    it('Where with empty properties', function() {
        expect(u()
            .where({})
            .process([null, void 0, 'a', 1, 0, false, {x: 1}, {}])
        ).toEqual([null, void 0, 'a', 1, 0, false, {x: 1}, {}]);
    });

    it('Where with string', function() {
        expect(u()
            .where('abc')
            .process([null, void 0, 'a', 1, 0, false, {x: 1}, {}])
        ).toEqual([null, void 0, 'a', 1, 0, false, {x: 1}, {}]);
    });

    it('Where with number', function() {
        expect(u()
            .where(42)
            .process([null, void 0, 'a', 1, 0, false, {x: 1}, {}])
        ).toEqual([null, void 0, 'a', 1, 0, false, {x: 1}, {}]);
    });

    it('Where without parameter', function() {
        expect(u()
            .where()
            .process([null, void 0, 'a', 1, 0, false, {x: 1}, {}])
        ).toEqual([null, void 0, 'a', 1, 0, false, {x: 1}, {}]);
    });
});
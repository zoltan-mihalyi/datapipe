var u = require('../../dist/main');

describe('where tests', function() {
    it('Calling where should work as expected.', function() {
        expect(u()
            .where({x: 1})
            .process([{x: 1}, {x: 2, y: 3}, {x: 1, y: 4}])
        ).toEqual([{x: 1}, {x: 1, y: 4}]);
    });

    it('where with empty properties', function() {
        expect(u()
            .where({})
            .process([null, void 0, 'a', 1, 0, false, {x: 1}, {}])
        ).toEqual([null, void 0, 'a', 1, 0, false, {x: 1}, {}]);
    });

    it('where with string', function() {
        expect(u()
            .where('abc')
            .process([null, void 0, 'a', 1, 0, false, {x: 1}, {}])
        ).toEqual([null, void 0, 'a', 1, 0, false, {x: 1}, {}]);
    });

    it('where with number', function() {
        expect(u()
            .where(42)
            .process([null, void 0, 'a', 1, 0, false, {x: 1}, {}])
        ).toEqual([null, void 0, 'a', 1, 0, false, {x: 1}, {}]);
    });

    it('where without parameter', function() {
        expect(u()
            .where()
            .process([null, void 0, 'a', 1, 0, false, {x: 1}, {}])
        ).toEqual([null, void 0, 'a', 1, 0, false, {x: 1}, {}]);
    });

    it('where with undefined properties', function() {
        expect(u()
            .where({x: void 0})
            .process([{x: 1}, {}, {x: void 0}])
        ).toEqual([{x: void 0}]);
    });

    it('Where with changing properties', function() {
        var attrs = {x: 1};
        var fn = u()
            .where(attrs)
            .fn();
        attrs.x = 2;

        expect(fn([{x: 1}, {}, {x: 2}])).toEqual([{x: 1}]);
    });
});
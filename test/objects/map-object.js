var u = require('../../dist/main');

describe('mapObject tests', function() {
    it('default behavior', function() {
        expect(u()
            .mapObject(function(x) {
                return x + 1;
            })
            .process({a: 1, b: 2})
        ).toEqual({a: 2, b: 3});
    });

    it('mapObject with context', function() {
        expect(u()
            .mapObject(function(x) {
                return x + this.value;
            }, {value: 1})
            .process({a: -1, b: 0, c: 1})
        ).toEqual({a: 0, b: 1, c: 2});
    });

    it('mapObject with null', function() {
        expect(u()
            .mapObject(null)
            .process({a: 1, b: 2})
        ).toEqual({a: 1, b: 2});
    });

    it('mapObject with property', function() {
        expect(u()
            .mapObject('a')
            .process({x: {a: 0}, y: {a: 1}, z: {a: 2}})
        ).toEqual({x: 0, y: 1, z: 2});
    });

    it('mapObject with properties', function() {
        expect(u()
            .mapObject({a: 1})
            .process({x: {a: 0}, y: {a: 1}, z: {a: 2}})
        ).toEqual({x: false, y: true, z: false});
    });

    it('mapObject array', function() {
        expect(u()
            .mapObject(function(x) {
                return x + 1;
            })
            .process([1, 2, 3])
        ).toEqual({0: 2, 1: 3, 2: 4});
    });

    it('mapObject array with extra properties', function() {
        var array = [1, 2];
        array.x = 3;
        expect(u()
            .mapObject(function(x) {
                return x + 1;
            })
            .process(array)
        ).toEqual({0: 2, 1: 3, x: 4});
    });

    it('mapObject should not contain object check if data type is specified', function() {
        expect(u()
            .mapObject(function() {
            })
            .fn()
            .toString()
        ).toContain('object');

        expect(u('object')
            .mapObject(function() {
            })
            .fn()
            .toString()
        ).not.toContain('object');

        expect(u('array')
            .mapObject(function() {
            })
            .fn()
            .toString()
        ).not.toContain('object');
    });

    it('mapObject object with parent', function() {
        function Obj() {
            this.x = 1;
        }

        Obj.prototype.y = 2;

        expect(u()
            .mapObject()
            .process(new Obj())
        ).toEqual({x: 1});
    });

    it('mapObject string', function() {
        expect(u()
            .mapObject()
            .process('abc')
        ).toEqual({});
    });

    it('mapObject after map', function() {
        expect(u()
            .map(function(x) {
                return x;
            })
            .mapObject(function(x) {
                return x + 1;
            })
            .process({a: 1, b: 2})
        ).toEqual({0: 2, 1: 3});
    });
});
var u = require('../../dist/main');

describe('indexBy tests', function() {
    var data = [{x: 1, y: 2}, {z: 1}, {a: 3, x: 1}, {x: 2, y: 3}];
    var afterInfex = {
        1: {a: 3, x: 1},
        2: {x: 2, y: 3},
        undefined: {z: 1}
    };

    it('indexBy with property name', function() {
        expect(u()
            .indexBy('x')
            .process(data)
        ).toEqual(afterInfex);
    });

    it('indexBy with function', function() {
        expect(u()
            .indexBy(function(x) {
                return x.x;
            })
            .process(data)
        ).toEqual(afterInfex);
    });

    it('indexBy with context', function() {
        expect(u()
            .indexBy(function(x) {
                return x[this];
            }, 'x')
            .process(data)
        ).toEqual(afterInfex);
    });

    it('indexBy with properties', function() {
        expect(u()
            .indexBy({x: 1})
            .process(data)
        ).toEqual({
            true: {a: 3, x: 1},
            false: {x: 2, y: 3}
        });
    });

    it('indexBy null', function() {
        expect(u()
            .indexBy()
            .process([1, 2, 2])
        ).toEqual({
            1: 1,
            2: 2
        });
    });
});
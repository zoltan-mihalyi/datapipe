var dp = require('../../dist/datapipe');

describe('indexBy tests', function() {
    var data = [{x: 1, y: 2}, {z: 1}, {a: 3, x: 1}, {x: 2, y: 3}];
    var afterInfex = {
        1: {a: 3, x: 1},
        2: {x: 2, y: 3},
        undefined: {z: 1}
    };

    it('indexBy with property name', function() {
        expect(dp()
            .indexBy('x')
            .process(data)
        ).toEqual(afterInfex);
    });

    it('indexBy with function', function() {
        expect(dp()
            .indexBy(function(x) {
                return x.x;
            })
            .process(data)
        ).toEqual(afterInfex);
    });

    it('indexBy with context', function() {
        expect(dp()
            .indexBy(function(x) {
                return x[this];
            }, 'x')
            .process(data)
        ).toEqual(afterInfex);
    });
});
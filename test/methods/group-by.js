var dp = require('../../dist/datapipe');

describe('groupBy tests', function() {
    var data = [{x: 1, y: 2}, {z: 1}, {a: 3, x: 1}, {x: 2, y: 3}];
    var afterGroup = {
        1: [{x: 1, y: 2}, {a: 3, x: 1}],
        2: [{x: 2, y: 3}],
        undefined: [{z: 1}]
    };

    it('groupBy with property name', function() {
        expect(dp()
            .groupBy('x')
            .process(data)
        ).toEqual(afterGroup);
    });

    it('groupBy with function', function() {
        expect(dp()
            .groupBy(function(x) {
                return x.x;
            })
            .process(data)
        ).toEqual(afterGroup);
    });

    it('groupBy with context', function() {
        expect(dp()
            .groupBy(function(x) {
                return x[this];
            }, 'x')
            .process(data)
        ).toEqual(afterGroup);
    });
});
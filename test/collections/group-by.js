var u = require('../../dist/main');

describe('groupBy tests', function() {
    var data = [{x: 1, y: 2}, {z: 1}, {a: 3, x: 1}, {x: 2, y: 3}];
    var afterGroup = {
        1: [{x: 1, y: 2}, {a: 3, x: 1}],
        2: [{x: 2, y: 3}],
        undefined: [{z: 1}]
    };

    it('groupBy with property name', function() {
        expect(u()
            .groupBy('x')
            .process(data)
        ).toEqual(afterGroup);
    });

    it('groupBy with function', function() {
        expect(u()
            .groupBy(function(x) {
                return x.x;
            })
            .process(data)
        ).toEqual(afterGroup);
    });

    it('groupBy with context', function() {
        expect(u()
            .groupBy(function(x) {
                return x[this];
            }, 'x')
            .process(data)
        ).toEqual(afterGroup);
    });

    it('groupBy with properties', function() {
        expect(u()
            .groupBy({x: 1})
            .process(data)
        ).toEqual({
            true: [{x: 1, y: 2}, {a: 3, x: 1}],
            false: [{z: 1}, {x: 2, y: 3}]
        });
    });

    it('groupBy without parameters', function() {
        expect(u()
            .groupBy()
            .process([3, 1, 3, 3, 2, 2])
        ).toEqual({
            1: [1],
            2: [2, 2],
            3: [3, 3, 3]
        });
    });
});
var u = require('../../dist/main');

describe('countBy tests', function() {
    it('countBy without parameters', function() {
        expect(u()
            .countBy()
            .process([1, 2, 1, 3, 3])
        ).toEqual({
            1: 2,
            2: 1,
            3: 2
        });
    });

    it('countBy with property name', function() {
        expect(u()
            .countBy('x')
            .process([{x: 1}, {x: 2}, {x: 1}, {x: 3}, {x: 3}])
        ).toEqual({
            1: 2,
            2: 1,
            3: 2
        });
    });

    it('countBy with function', function() {
        expect(u()
            .countBy(function(x) {
                return x % 2 === 0 ? 'even' : 'odd';
            })
            .process([1, 2, 3, 4, 5])
        ).toEqual({
            even: 2,
            odd: 3
        });
    });

    it('countBy with context', function() {
        expect(u()
            .countBy(function(x) {
                return x % this.value === 0 ? 'even' : 'odd';
            }, {value: 2})
            .process([1, 2, 3, 4, 5])
        ).toEqual({
            even: 2,
            odd: 3
        });
    });

    it('countBy with properties', function() {
        expect(u()
            .countBy({a: 1})
            .process([{a: 1}, {a: 2}, {a: 3}, {}])
        ).toEqual({
            true: 1,
            false: 3
        });
    });
});
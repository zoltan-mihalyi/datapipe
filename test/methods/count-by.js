var dp = require('../../dist/datapipe');

describe('countBy tests', function() {
    it('countBy without parameters', function() {
        expect(dp()
            .countBy()
            .process([1, 2, 1, 3, 3])
        ).toEqual({
            1: 2,
            2: 1,
            3: 2
        });
    });

    it('countBy with property name', function() {
        expect(dp()
            .countBy('x')
            .process([{x: 1}, {x: 2}, {x: 1}, {x: 3}, {x: 3}])
        ).toEqual({
            1: 2,
            2: 1,
            3: 2
        });
    });

    it('countBy with function', function() {
        expect(dp()
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
        expect(dp()
            .countBy(function(x) {
                return x % this.value === 0 ? 'even' : 'odd';
            }, {value: 2})
            .process([1, 2, 3, 4, 5])
        ).toEqual({
            even: 2,
            odd: 3
        });
    });
});
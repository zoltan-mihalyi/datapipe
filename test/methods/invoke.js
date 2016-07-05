var u = require('../../dist/main');

describe('invoke tests', function() {
    it('invoking methods without parameter', function() {
        expect(u()
            .invoke('toString')
            .process([1, {
                toString: function() {
                    return '2';
                }
            }, [3, 4]])
        ).toEqual(['1', '2', '3,4']);
    });

    it('invoking methods with parameters', function() {
        expect(u()
            .invoke('method', 'x', 'y')
            .process([{
                method: function(x, y) {
                    return x + y
                }
            }, {
                method: function(x) {
                    return x
                }
            }])
        ).toEqual(['xy', 'x']);
    });

    it('invoking methods when some objects does not have the method and some of them has null-like values', function() {
        expect(u()
            .invoke('toFixed')
            .process(['1', 1, {toFixed: null}])
        ).toEqual([void 0, '1', null]);
    });

    it('invoking method when it is a function', function() {
        expect(u()
            .invoke(function(x) {
                return this.x + x;
            }, 1)
            .process([{x: 0}, {x: ''}])
        ).toEqual([1, '1']);
    });
});
var u = require('../../dist/main');

describe('has tests', function() {
    it('has with simple object', function() {
        expect(u()
            .has('x')
            .process({x: 1})
        ).toBe(true);

        expect(u()
            .has('y')
            .process({x: 1})
        ).toBe(false);
    });

    it('has with array', function() {
        expect(u()
            .has('length')
            .process([])
        ).toBe(true);
        expect(u()
            .has(0)
            .process([1, 2])
        ).toBe(true);
        expect(u()
            .has(2)
            .process([1, 2])
        ).toBe(false);
    });

    it('has with null and undefined', function() {
        expect(u()
            .has('x')
            .process(null)
        ).toBe(false);
        expect(u()
            .has('x')
            .process(void 0)
        ).toBe(false);
    });

    it('has with string', function() {
        expect(u()
            .has('0')
            .process('abc')
        ).toBe(true);
    });

    it('has with parent property', function() {
        expect(u()
            .has('toString')
            .process({})
        ).toBe(false);
    });

    it('has with redefined hasOwnProperty', function() {
        var obj = {
            hasOwnProperty: function() {
                return true;
            }
        };
        expect(u()
            .has('x')
            .process(obj)
        ).toBe(false);
    });
});
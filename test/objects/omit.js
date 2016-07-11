var u = require('../../dist/main');

describe('omit tests', function() {
    it('omit property names', function() {
        expect(u()
            .omit('a', 'c')
            .process({a: 1, b: 2, c: 3, d: 4})
        ).toEqual({b: 2, d: 4});
    });

    it('omit array', function() {
        expect(u()
            .omit(['a'], 'c')
            .process({a: 1, b: 2, c: 3, d: 4})
        ).toEqual({b: 2, d: 4});
    });

    it('omit from null object', function() {
        expect(u()
            .omit('a')
            .process(null)
        ).toEqual({});
    });

    it('omit with function', function() {
        expect(u()
            .omit(function(value, key) {
                return key < this.value;
            }, {value: 'c'})
            .process({a: 1, b: 2, c: 3, d: 4})
        ).toEqual({c: 3, d: 4});
    });

    it('omit with null property', function() {
        expect(u()
            .omit(null)
            .process({a: 1, null: 2})
        ).toEqual({a: 1});
    });
});
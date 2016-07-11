var u = require('../../dist/main');

describe('pick tests', function() {
    it('pick property names', function() {
        expect(u()
            .pick('a', 'c')
            .process({a: 1, b: 2, c: 3, d: 4})
        ).toEqual({a: 1, c: 3});
    });

    it('pick array', function() {
        expect(u()
            .pick(['a'], 'c')
            .process({a: 1, b: 2, c: 3, d: 4})
        ).toEqual({a: 1, c: 3});
    });

    it('pick from null object', function() {
        expect(u()
            .pick('a')
            .process(null)
        ).toEqual({});
    });

    it('pick with function', function() {
        expect(u()
            .pick(function(value, key) {
                return key < this.value;
            }, {value: 'c'})
            .process({a: 1, b: 2, c: 3, d: 4})
        ).toEqual({a: 1, b: 2});
    });

    it('pick with null property', function() {
        expect(u()
            .pick(null)
            .process({a: 1, null: 2})
        ).toEqual({null: 2});
    });
});
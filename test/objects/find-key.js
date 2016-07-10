var u = require('../../dist/main');

describe('findKey tests', function() {
    it('findKey when item is present', function() {
        expect(u()
            .findKey(function(obj) {
                return obj === 2;
            })
            .process({
                a: 1,
                b: 2,
                c: 3
            })
        ).toBe('b');
    });

    it('findKey when item is not present', function() {
        expect(u()
            .findKey(function(obj) {
                return obj === 4;
            })
            .process({
                a: 1,
                b: 2,
                c: 3
            })
        ).toBeUndefined();
    });

    it('findKey with context', function() {
        expect(u()
            .findKey(function(obj) {
                return obj === this.value;
            }, {value: 2})
            .process({
                a: 1,
                b: 2,
                c: 3
            })
        ).toBe('b');
    });

    it('findKey with property', function() {
        expect(u()
            .findKey('b')
            .process({
                x: {a: 1},
                y: {b: 2},
                z: {c: 3}
            })
        ).toBe('y');
    });

    it('findKey with properties', function() {
        expect(u()
            .findKey({a: 2})
            .process({
                x: {b: 2},
                y: {a: 3},
                z: {a: 2}
            })
        ).toBe('z');
    });

    it('findKey with array', function() {
        expect(u()
            .findKey(function(x) {
                return x === 3;
            })
            .process([1, 2, 3, 4])
        ).toBe('2');
    });

    it('findKey with string', function() {
        expect(u()
            .findKey(function(x) {
                return x === 'b';
            })
            .process('abc')
        ).toBeUndefined();
    });

    it('findKey without parameter', function() {
        expect(u()
            .findKey()
            .process({
                a: false,
                b: null,
                c: 0,
                d: '',
                e: 42
            })
        ).toBe('e');
    });
});
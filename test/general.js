var u = require('../dist/main');
var codeHelpers = require('../dist/code-helpers');

describe('Test general usage', function() {
    it('fn method', function() {
        var addOneToAll = u().map(function(x) {
            return x + 1;
        }).fn();

        expect(u()
            .map(addOneToAll)
            .process([[1, 2], [3, 4]])
        ).toEqual([[2, 3], [4, 5]]);
    });

    it('root process', function() {
        expect(u()
            .process([1, 2, 3])
        ).toEqual([1, 2, 3]);

        expect(u()
            .compile()
            .process([1, 2, 3])
        ).toEqual([1, 2, 3]);

        expect(u()
            .fn()([1, 2, 3])
        ).toEqual([1, 2, 3]);
    });

    it('iterate object', function() {
        expect(u()
            .pluck('x')
            .process({
                a: {x: 1},
                b: {x: 2},
                c: {x: 3}
            })
        ).toEqual([1, 2, 3])
    });

    it('iterate as object when length property is not number', function() {
        expect(u()
            .pluck('x')
            .process({
                a: {x: 1},
                b: {x: 2},
                length: {x: 3}
            })
        ).toEqual([1, 2, 3])
    });

    it('Calling functions with context should use .call, but without context should not.', function() {
        expect(u('array')
            .map(function() {
            }, {})
            .fn()
            .toString()
        ).toContain('.call');

        expect(u('array')
            .map(function() {
            })
            .fn()
            .toString()
        ).not.toContain('.call');
    });

    describe('Reuse parameters', function() {
        function identity(x) {
            return x;
        }

        it('Reuse parameters for the two loops', function() {
            expect(u()
                .map(identity)
                .fn()
                .toString()
            ).not.toContain(codeHelpers.paramName(2)); //hasOwnProperty and identity is allowed
        });

        it('Reuse parameters across steps and loops', function() {
            expect(u('array')
                .map(identity)
                .map(identity)
                .fn()
                .toString()
            ).not.toContain(codeHelpers.paramName(1));
        });
    });
});
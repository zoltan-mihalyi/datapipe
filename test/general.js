var dp = require('../dist/datapipe');
var codeHelpers = require('../dist/code-helpers');

describe('Test general usage', function() {
    it('fn method', function() {
        var addOneToAll = dp().map(function(x) {
            return x + 1;
        }).fn();

        expect(dp()
            .map(addOneToAll)
            .process([[1, 2], [3, 4]])
        ).toEqual([[2, 3], [4, 5]]);
    });

    it('root process', function() {
        expect(dp()
            .process([1, 2, 3])
        ).toEqual([1, 2, 3]);

        expect(dp()
            .compile()
            .process([1, 2, 3])
        ).toEqual([1, 2, 3]);

        expect(dp()
            .fn()([1, 2, 3])
        ).toEqual([1, 2, 3]);
    });

    it('iterate object', function() {
        expect(dp()
            .pluck('x')
            .process({
                a: {x: 1},
                b: {x: 2},
                c: {x: 3}
            })
        ).toEqual([1, 2, 3])
    });

    it('iterate as object when length property is not number', function() {
        expect(dp()
            .pluck('x')
            .process({
                a: {x: 1},
                b: {x: 2},
                length: {x: 3}
            })
        ).toEqual([1, 2, 3])
    });

    it('Calling functions with context should use .call, but without context should not.', function() {
        expect(dp()
            .map(function() {
            }, {})
            .fn()
            .toString()
        ).toContain('.call');

        expect(dp()
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
            expect(dp()
                .map(identity)
                .fn()
                .toString()
            ).not.toContain(codeHelpers.paramName(1));
        });

        it('Reuse parameters across steps and loops', function() {
            expect(dp('array')
                .map(identity)
                .map(identity)
                .fn()
                .toString()
            ).not.toContain(codeHelpers.paramName(1));
        });
    });
});
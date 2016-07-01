var codeHelpers = require('../dist/code-helpers');

describe('Test code helpers', function() {
    it('Add should equal the second parameter if first is zero.', function() {
        expect(codeHelpers.add(codeHelpers.literal(0), codeHelpers.literal(1))).toEqual(codeHelpers.literal(1));
    });

    it('Add should equal the first parameter if second is zero.', function() {
        expect(codeHelpers.add(codeHelpers.literal(1), codeHelpers.literal(0))).toEqual(codeHelpers.literal(1));
    });

    function add(a, b) {
        return codeHelpers.add(codeHelpers.literal(a), codeHelpers.literal(b))
    }

    describe('Test code equality', function() {
        it('Codes with same code should be equal', function() {
            expect(
                codeHelpers.codeTextEquals(add(1, 2), add(1, 2))
            ).toBe(true);
        });

        it('Codes with different length should not be equal', function() {
            expect(
                codeHelpers.codeTextEquals(codeHelpers.literal(1), add(1, 2))
            ).toBe(false);
        });

        it('Codes with same length not be equal if any of their items does not match', function() {
            expect(
                codeHelpers.codeTextEquals(add(1, 3), add(1, 2))
            ).toBe(false);
        });

    });
});
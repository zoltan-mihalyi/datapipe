var codeHelpers = require('../dist/code-helpers');

describe('Test code helpers', function() {
    it('Add should equal the second parameter if first is zero.', function() {
        expect(codeHelpers.add(codeHelpers.literal(0), codeHelpers.literal(1))).toEqual(codeHelpers.literal(1));
    });
    it('Add should equal the first parameter if second is zero.', function() {
        expect(codeHelpers.add(codeHelpers.literal(1), codeHelpers.literal(0))).toEqual(codeHelpers.literal(1));
    });
});
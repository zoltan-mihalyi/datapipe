var u = require('../../dist/main');

describe('compact tests', function() {
    it('compact should filter falsy values', function() {
        expect(u().compact().process([0, 1, '', 2, null, void 0, 3, false, 4])).toEqual([1, 2, 3, 4]);
    });
});
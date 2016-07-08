var u = require('../../dist/main');

describe('size tests', function() {
    it('array size', function() {
        expect(u().size().process([1, 2, 3])).toEqual(3);
    });

    it('object size', function() {
        expect(u().size().process({a: 1, b: 2, c: 3})).toEqual(3);
    });

    it('reduce and size', function() {
        expect(u()
            .reduce(function(memo, x) {
                if (x % 2 === 0) {
                    memo.push(x);
                }
                return memo;
            }, function() {
                return [];
            })
            .size()
            .process([1, 2, 3, 4, 5, 6])
        ).toBe(3);
    });

    it('size should not use iteration to determine array size', function() {
        expect(u()
            .size()
            .fn()
            .toString()
        ).not.toContain('<');
    });

    it('size should not evaluate the values of the object', function() {
        expect(u()
            .size()
            .fn()
            .toString()
        ).not.toContain('[');
    });
});
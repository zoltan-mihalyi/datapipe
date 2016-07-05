var u = require('../../dist/main');

describe('initial tests', function() {
    it('Calling initial should exclude N elements at the end of the array.', function() {
        expect(u().initial(2).process([1, 2, 3, 4, 5, 6])).toEqual([1, 2, 3, 4]);
    });

    it('initial with object', function() {
        expect(u().initial(2).process({a: 1, b: 2, c: 3, d: 4, e: 5, f: 6})).toEqual([1, 2, 3, 4]);
    });

    it('initial without parameter', function() {
        expect(u().initial().process([1, 2, 3])).toEqual([1, 2]);
    });

    it('using initial after map should use fixed array length', function() {
        expect(u()
            .map(function() {
            })
            .initial(2)
            .fn()
            .toString()
        ).toContain('new Array');
    });

    it('using initial twice should be the same as calling initial with the sum', function() {
        expect(u('array')
            .initial(2)
            .initial(3)
            .fn()
            .toString()
        ).toBe(u('array').initial(5).fn().toString());
    });

    it('initial and remove more items from the array than it contains.', function() {
        expect(u()
            .initial(2)
            .process([1])
        ).toEqual([]);
    });


    it('initial and take', function() {
        expect(u()
            .initial(2)
            .take(2)
            .process([1, 2, 3, 4, 5])
        ).toEqual([1, 2]);
    });

    it('initial and size', function() {
        expect(u()
            .initial(2)
            .size()
            .process([1, 2, 3, 4, 5])
        ).toEqual(3);
    });

    it('initial, take and size', function() {
        expect(u()
            .initial(2)
            .take(2)
            .size()
            .process([1, 2, 3, 4, 5])
        ).toEqual(2);
    });

    it('initial and take', function() {
        expect(u()
            .initial(2)
            .take(2)
            .process([1, 2, 3])
        ).toEqual([1]);
    });
});
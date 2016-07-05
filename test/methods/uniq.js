var u = require('../../dist/main');

describe('uniq tests', function() {
    it('uniq should filter the duplicates', function() {
        expect(u()
            .uniq()
            .process([1, 2, 2, 3, 4, 3])
        ).toEqual([1, 2, 3, 4]);
    });

    it('uniq with object', function() {
        expect(u()
            .uniq()
            .process({
                a: 1,
                b: 1,
                c: 2,
                d: 3,
                e: 2,
                f: 4
            })
        ).toEqual([1, 2, 3, 4]);
    });

    it('uniq sorted array', function() {
        expect(u()
            .uniq(true)
            .process([1, 1, 2, 3, 3, 4])
        ).toEqual([1, 2, 3, 4]);
    });

    it('uniq with iteratee', function() {
        expect(u()
            .uniq('x')
            .process([{x: 0}, {x: null}, {x: 1, a: 1}, {x: 1, a: 2}, {x: 0}, {}, {x: 1, a: 3}])
        ).toEqual([{x: 0}, {x: null}, {x: 1, a: 1}, {}]);
    });

    it('uniq with iteratee and context', function() {
        expect(u()
            .uniq(function(x) {
                return x[this.value];
            }, {value: 'x'})
            .process([{x: 0}, {x: null}, {x: 1, a: 1}, {x: 1, a: 2}, {x: 0}, {}, {x: 1, a: 3}])
        ).toEqual([{x: 0}, {x: null}, {x: 1, a: 1}, {}]);
    });

    it('uniq sorted array with iteratee', function() {
        expect(u()
            .uniq(true, 'x')
            .process([{x: 0}, {x: null}, {x: 1, a: 1}, {x: 1, a: 2}, {}])
        ).toEqual([{x: 0}, {x: null}, {x: 1, a: 1}, {}]);
    });

    it('uniq sorted array with iteratee and context', function() {
        expect(u()
            .uniq(true, function(x) {
                return x[this.value];
            }, {value: 'x'})
            .process([{x: 0}, {x: null}, {x: 1, a: 1}, {x: 1, a: 2}, {}])
        ).toEqual([{x: 0}, {x: null}, {x: 1, a: 1}, {}]);
    });
});
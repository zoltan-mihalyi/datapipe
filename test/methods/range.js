var u = require('../../dist/main');

describe('range tests', function() {
    it('range with one parameter', function() {
        expect(u()
            .range(3)
            .process()
        ).toEqual([0, 1, 2]);
    });

    it('range with two parameters', function() {
        expect(u()
            .range(3, 6)
            .process()
        ).toEqual([3, 4, 5]);
    });

    it('range with three parameters', function() {
        expect(u()
            .range(0, 30, 5)
            .process()
        ).toEqual([0, 5, 10, 15, 20, 25]);
    });

    it('range with negative direction', function() {
        expect(u()
            .range(2, -5, -2)
            .process()
        ).toEqual([2, 0, -2, -4]);
    });
});
var u = require('../../dist/main');

describe('extendOwn tests', function() {
    it('extendOwn general test', function() {
        expect(u()
            .extendOwn({a: 1, b: 2}, {b: 3})
            .process({a: 0, d: 1})
        ).toEqual({a: 1, b: 3, d: 1});
    });

    it('extendOwn with parent', function() {
        function Obj() {
            this.a = 1;
        }

        Obj.prototype.x = 1;
        expect(u()
            .extendOwn(new Obj())
            .process({a: 0, b: 1})
        ).toEqual({a: 1, b: 1});
    });
});
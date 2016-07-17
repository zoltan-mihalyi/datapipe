var u = require('../../dist/main');

describe('isEmpty tests', function() {
    it('isEmpty array', function() {
        expect(u()
            .isEmpty()
            .process([])
        ).toBe(true);

        expect(u()
            .isEmpty()
            .process(['item'])
        ).toBe(false);
    });

    it('isEmpty arguments', function() {
        function args() {
            return arguments;
        }

        expect(u()
            .isEmpty()
            .process(args())
        ).toBe(true);

        expect(u()
            .isEmpty()
            .process(args(1))
        ).toBe(false);
    });

    it('isEmpty objects', function() {
        expect(u()
            .isEmpty()
            .process({})
        ).toBe(true);

        expect(u()
            .isEmpty()
            .process({a: 1})
        ).toBe(false);
    });

    it('isEmpty string', function() {
        expect(u()
            .isEmpty()
            .process('')
        ).toBe(true);

        expect(u()
            .isEmpty()
            .process('a')
        ).toBe(false);
    });

    it('isEmpty null', function() {
        expect(u()
            .isEmpty()
            .process(null)
        ).toBe(true);
        expect(u()
            .isEmpty()
            .process()
        ).toBe(true);
    });

    it('isEmpty with parent', function() {
        function Obj() {
        }

        Obj.prototype.x = 1;
        var obj = new Obj();

        expect(u()
            .isEmpty()
            .process(obj)
        ).toBe(true);
        obj.y = 2;
        expect(u()
            .isEmpty()
            .process(obj)
        ).toBe(false);
    });
});
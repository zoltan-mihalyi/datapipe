var u = require('../../dist/main');

describe('functions tests', function() {
    it('functions of object is an array of method names of the object', function() {
        expect(u()
            .functions()
            .process({
                a: 1,
                b: function() {
                },
                c: function() {
                },
                d: 2
            })
        ).toEqual(['b', 'c']);
    });

    it('functions with parent', function() {
        function Obj() {
        }

        Obj.prototype.x = function() {
        };
        expect(u()
            .functions()
            .process(new Obj())
        ).toEqual(['x']);
    });

    it('functions with null', function() {
        expect(u()
            .functions()
            .process(null)
        ).toEqual([]);
    });

    it('functions with array', function() {
        expect(u()
            .functions()
            .process(['a', function() {
            }, 'c'])
        ).toEqual(['1']);
    });
});
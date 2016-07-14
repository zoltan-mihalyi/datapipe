var u = require('../../dist/main');

describe('matcher tests', function() {
    it('object matcher', function() {
        var matcher = u()
            .matcher()
            .process({a: 1, b: 2});

        expect(matcher({a: 1, b: 1, c: 3})).toBe(false);
        expect(matcher({a: 1})).toBe(false);
        expect(matcher({a: 1, b: 2, c: 3})).toBe(true)
    });

    it('object with parent', function() {
        function Obj() {
        }

        Obj.prototype.x = 1;
        var matcher = u()
            .matcher()
            .process(new Obj());

        expect(matcher({})).toBe(true);
        expect(matcher({x: 2})).toBe(true);
    });

    it('object with undefined properties', function() {
        var matcher = u()
            .matcher()
            .process({x: void 0});

        expect(matcher({})).toBe(false);
        expect(matcher({x: void 0})).toBe(true);
    });

    it('matcher should work after changing original object', function() {
        var attrs = {x: 1};
        var matcher = u()
            .matcher()
            .process(attrs);
        attrs.x = 2;

        expect(matcher({x: 1})).toBe(true);
    });
});
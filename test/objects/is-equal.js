var u = require('../../dist/main');

describe('isEqual tests', function() {
    it('isEqual string', function() {
        var equal = u()
            .isEqual('abc')
            .fn();

        expect(equal('abc')).toBe(true);
        expect(equal(Object('abc'))).toBe(true);
        expect(equal('abcd')).toBe(false);
    });

    it('isEqual regExp', function() {
        var equal = u()
            .isEqual(/abc/i)
            .fn();

        expect(equal(/abc/i)).toBe(true);
        expect(equal(new RegExp('abc', 'i'))).toBe(true);
        expect(equal('/abc/i')).toBe(false);
        expect(equal(/abcd/i)).toBe(false);
        expect(equal(/abc/g)).toBe(false);
    });

    it('isEqual number', function() {
        var equal = u()
            .isEqual(1)
            .fn();
        expect(equal(1)).toBe(true);
        expect(equal(Object(1))).toBe(true);
        expect(equal(new Date(1))).toBe(false);
        expect(equal(2)).toBe(false);
        expect(equal(Object(2))).toBe(false);
    });

    it('isEqual zero', function() {
        var equal = u()
            .isEqual(0)
            .fn();
        expect(equal(0)).toBe(true);
        expect(equal(Object(0))).toBe(true);
        expect(equal(-0)).toBe(false);
        expect(equal(Object(-0))).toBe(false);
        expect(equal(1)).toBe(false);
        expect(equal(Object(1))).toBe(false);
        expect(equal(new Date(0))).toBe(false);
    });

    it('isEqual NaN', function() {
        var equal = u()
            .isEqual(NaN)
            .fn();
        expect(equal(NaN)).toBe(true);
        expect(equal(Object(NaN))).toBe(true);
        expect(equal(0)).toBe(false);
        expect(equal(null)).toBe(false);
        expect(equal('abc')).toBe(false);
    });

    it('isEqual dates', function() {
        var equal = u()
            .isEqual(new Date(1234567890000))
            .fn();
        expect(equal(new Date(1234567890000))).toBe(true);
        expect(equal(Object(1234567890000))).toBe(false);
        expect(equal(1234567890000)).toBe(false);
        expect(equal(new Date(1234567890001))).toBe(false);
    });


    it('isEqual null', function() {
        var equal = u()
            .isEqual(null)
            .fn();
        expect(equal(null)).toBe(true);
        expect(equal(void 0)).toBe(false);
        expect(equal(0)).toBe(false);
    });

    it('isEqual undefined', function() {
        var equal = u()
            .isEqual(void 0)
            .fn();
        expect(equal(void 0)).toBe(true);
        expect(equal(null)).toBe(false);
        expect(equal(0)).toBe(false);
    });

    it('isEqual boolean', function() {
        var equal = u()
            .isEqual(false)
            .fn();
        expect(equal(false)).toBe(true);
        expect(equal(Object(false))).toBe(true);
        expect(equal(true)).toBe(false);
        expect(equal(Object(true))).toBe(false);
    });

    it('isEqual functions', function() {
        function fn1() {
        }

        function fn2() {
        }

        var equal = u()
            .isEqual(fn1)
            .fn();
        expect(equal(fn1)).toBe(true);
        expect(equal(fn2)).toBe(false);
    });

    it('isEqual different types', function() {
        var equal = u()
            .isEqual('0')
            .fn();
        expect(equal('0')).toBe(true);
        expect(equal(0)).toBe(false);
    });

    describe('isEqual arrays', function() {
        it('simple arrays', function() {
            var equal = u()
                .isEqual([1, 2, 3])
                .fn();
            expect(equal([1, 2, 3])).toBe(true);
            expect(equal([1, 3, 3])).toBe(false);
            expect(equal([1, 2])).toBe(false);
            expect(equal([1, 2, 3, 4])).toBe(false);
        });
    });

    describe('isEqual arrays and strings', function() {
        it('simple arrays', function() {
            var equal = u()
                .isEqual(['1', '2', '3'])
                .fn();
            expect(equal('123')).toBe(false);
        });
    });

    describe('isEqual arrays nested', function() {
        it('simple arrays', function() {
            var equal = u()
                .isEqual([1, 2, [3, 4], [5]])
                .fn();
            expect(equal([1, 2, [3, 4], [5]])).toBe(true);
            expect(equal([1, 0, [3, 4], [5]])).toBe(false);
            expect(equal([1, 2, [3, 0], [5]])).toBe(false);
            expect(equal([1, 3, 3, 4, 5])).toBe(false);
            expect(equal([1, 2, [], []])).toBe(false);
            expect(equal([1, 2, [3]])).toBe(false);
            expect(equal([1, 2, [3, 4, 5]])).toBe(false);
        });
    });

    describe('isEqual arrays recursive', function() {
        it('simple arrays', function() {
            var array = [1, 2, 3];
            array[3] = array;
            var equal = u()
                .isEqual(array)
                .fn();


            var array2 = [1, 2, 3];
            array2[3] = array2;

            expect(equal(array2)).toBe(true);
            expect(equal([1, 3, 3])).toBe(false);
            expect(equal([1, 2, 3, [1, 2, 3, [1, 2, 3, 4]]])).toBe(false);
            expect(equal([1, 2, 3, array])).toBe(false);
            expect(equal([1, 2, 3, array2])).toBe(false);
        });
    });

    describe('isEqual objects', function() {
        var equal = u()
            .isEqual({a: 1, b: 2, c: void 0})
            .fn();

        expect(equal({a: 1, b: 2, c: void 0})).toBe(true);
        expect(equal({b: 2, c: void 0, a: 1})).toBe(true);
        expect(equal({a: 1, b: 2, c: void 0, d: 3})).toBe(false);
        expect(equal({a: 1, b: 2})).toBe(false);
        expect(equal({a: 1, b: 2})).toBe(false);
        expect(equal({})).toBe(false);
    });

    describe('isEqual objects recursive', function() {
        var obj = {a: 1};
        obj.b = obj;
        var equal = u()
            .isEqual(obj)
            .fn();

        var obj2 = {a: 1};
        obj2.b = obj2;

        expect(equal(obj2)).toBe(true);
        expect(equal({a: 1})).toBe(false);
        expect(equal({a: 1, b: {a: 1, b: {a: 1}}})).toBe(false);
        expect(equal({a: 1, b: obj})).toBe(false);
        expect(equal({a: 1, b: obj2})).toBe(false);
    });

    describe('isEqual objects with parent', function() {
        function Obj(x) {
            this.x = x;
        }

        Obj.prototype.y = 2;

        var equal = u()
            .isEqual(new Obj(1))
            .fn();

        expect(equal(new Obj(1))).toBe(true);
        expect(equal(new Obj(2))).toBe(false);
        expect(equal({x: 1})).toBe(false);
        expect(equal({x: 1, y: 2})).toBe(false);
    });

    describe('isEqual objects without parent', function() {
        function Obj(x) {
            this.x = x;
        }

        Obj.prototype.y = 2;

        var equal = u()
            .isEqual({x: 1})
            .fn();

        expect(equal({x: 1})).toBe(true);
        expect(equal(new Obj(1))).toBe(false);
    });

    describe('isEqual object with no constructor', function() {
        var equal1 = u()
            .isEqual({})
            .fn();
        var equal2 = u()
            .isEqual(Object.create(null))
            .fn();

        expect(equal1({})).toBe(true);
        expect(equal1(Object.create(null))).toBe(true);
        expect(equal2({})).toBe(true);
        expect(equal2(Object.create(null))).toBe(true);
    });
});
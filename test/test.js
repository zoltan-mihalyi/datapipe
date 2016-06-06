var dp = require('../dist/datapipe');
var codeHelpers = require('../dist/code-helpers');

describe('Test general usage', function() {
    it('fn method', function() {
        var addOneToAll = dp().map(function(x) {
            return x + 1;
        }).fn();

        expect(dp()
            .map(addOneToAll)
            .process([[1, 2], [3, 4]])
        ).toEqual([[2, 3], [4, 5]]);
    });

    it('root process', function() {
        expect(dp()
            .process([1, 2, 3])
        ).toEqual([1, 2, 3]);

        expect(dp()
            .compile()
            .process([1, 2, 3])
        ).toEqual([1, 2, 3]);

        expect(dp()
            .fn()([1, 2, 3])
        ).toEqual([1, 2, 3]);
    });

    it('iterate object', function() {
        expect(dp()
            .pluck('x')
            .process({
                a: {x: 1},
                b: {x: 2},
                c: {x: 3}
            })
        ).toEqual([1, 2, 3])
    });

    it('iterate as object when length property is not number', function() {
        expect(dp()
            .pluck('x')
            .process({
                a: {x: 1},
                b: {x: 2},
                length: {x: 3}
            })
        ).toEqual([1, 2, 3])
    });

    describe('Data type hints', function() {
        describe('Giving hint of data type causes shorter functions to be generated, and the shorter function produces the same result.', function() {
            var pluckX = dp()
                .pluck('x')
                .fn();

            it('array hint', function() {
                var pluckXArray = dp('array')
                    .pluck('x')
                    .fn();
                expect(pluckXArray.toString().length)
                    .toBeLessThan(pluckX.toString().length);

                expect(pluckXArray([{x: 1}, {x: 2}]))
                    .toEqual([1, 2]);
            });

            it('object hint', function() {
                var pluckXObject = dp('object')
                    .pluck('x')
                    .fn();

                expect(pluckXObject.toString().length)
                    .toBeLessThan(pluckX.toString().length);

                expect(pluckXObject({
                    a: {x: 1},
                    b: {x: 2}
                })).toEqual([1, 2]);
            });
        });

        it('array hint when using arrayIndex', function() {
            expect(dp('array')
                .take(2)
                .pluck('x')
                .process([{x: 1}, {x: 3}, {x: 2}])
            ).toEqual([1, 3]);
        });

        it('When the previous step creates an array, the next step should not contain the object iteration, but should work.', function() {
            var sortAndPluck = dp('array')
                .sortBy('x')
                .pluck('y')
                .fn();

            expect(sortAndPluck.toString()).not.toContain(' in ');

            expect(sortAndPluck([{x: 2, y: 3}, {x: 1, y: 4}]))
                .toEqual([4, 3]);
        });
    });

    it('Calling functions with context should use .call, but without context should not.', function() {
        expect(dp()
            .map(function() {
            }, {})
            .fn()
            .toString()
        ).toContain('.call');

        expect(dp()
            .map(function() {
            })
            .fn()
            .toString()
        ).not.toContain('.call');
    });

    describe('Reuse parameters', function() {
        function identity(x) {
            return x;
        }

        it('Reuse parameters for the two loops', function() {
            expect(dp()
                .map(identity)
                .fn()
                .toString()
            ).not.toContain(codeHelpers.paramName(1));
        });

        it('Reuse parameters across steps and loops', function() {
            expect(dp('array')
                .map(identity)
                .map(identity)
                .fn()
                .toString()
            ).not.toContain(codeHelpers.paramName(1));
        });
    });

    describe('Passing index to functions', function() {
        it('should pass index when needed', function() {
            expect(dp()
                .map(function(x, i) {
                    return i;
                })
                .process([1, 2, 3, 4, 5])
            ).toEqual([0, 1, 2, 3, 4]);

            expect(dp()
                .reduce(function(memo, x, i) {
                    return memo + i;
                }, 0)
                .process([1, 2, 3])
            ).toEqual(3);

            expect(dp()
                .indexBy(function(x, i) {
                    return i;
                })
                .process([1, 2, 3])
            ).toEqual({
                0: 1,
                1: 2,
                2: 3
            });
        });

        it('When iterating an object, the index passed to the function should be the key of the entry, not the index.', function() {
            expect(dp()
                .map(function(x, i) {
                    return i;
                })
                .process({
                    a: 1,
                    b: 2,
                    c: 3
                })
            ).toEqual(['a', 'b', 'c']);
        });

        it('object to array transformation should change index', function() {
            expect(dp()
                .map(function(a) {
                    return a;
                })
                .map(function(x, i) {
                    return i;
                })
                .process({
                    a: 1,
                    b: 2,
                    c: 3
                })
            ).toEqual([0, 1, 2]);
        });

        it('should work with changing index, creating additional index variable', function() {
            var process = dp()
                .filter(function(x) {
                    return x % 2 === 0;
                })
                .map(function(x, i) {
                    return i;
                }).fn();

            expect(process([0, 1, 2, 3, 4, 5])).toEqual([0, 1, 2]);
            expect(process.toString()).toContain('var i_');

        });

        it('after a changing index, creating one index variable for multiple steps', function() {
            var process = dp()
                .filter(function(x) {
                    return x % 2 === 0;
                })
                .map(function(x, i) {
                    return i;
                })
                .map(function(x, i) {
                    return i;
                }).fn();

            expect(process([0, 1, 2, 3, 4, 5])).toEqual([0, 1, 2]);
            expect(process.toString()).not.toContain('var i_1');

        });

        it('should work when the same step modifies the index which uses it.', function() {
            expect(dp()
                .filter(function(x, i) {
                    return i % 2 === 0;
                })
                .process([1, 2, 3, 4])
            ).toEqual([1, 3]);
        });

        it('should not create additional index variable when not using index', function() {
            expect(dp()
                .filter(function() {
                })
                .map(function(x) {
                    return x;
                })
                .fn()
                .toString()
            ).not.toContain('var i_');
        });

        it('should generate lesser code when the index parameter is not used', function() {
            expect(dp()
                .map(function() {
                })
                .fn()
                .toString()
                .length
            ).toBeLessThan(dp()
                .map(function(x, i) {
                    return i;
                })
                .fn()
                .toString()
                .length
            );
        });
    });
});

describe('Test functions without chaining', function() {
    describe('map tests', function() {
        it('Mapping an array should return an array with items mapped with the function.', function() {
            expect(dp().map(function(x) {
                return x + 1;
            }).process([-1, 0, 1])).toEqual([0, 1, 2]);
        });

        it('map with context', function() {
            expect(dp().map(function(x) {
                return x + this.value;
            }, {value: 1}).process([-1, 0, 1])).toEqual([0, 1, 2]);
        });
    });

    describe('filter tests', function() {
        it('Filtering an array should return an array of the items matching the predicate.', function() {
            expect(dp().filter(function(x) {
                return x % 2 === 0;
            }).process([0, 1, 2, 3, 4])).toEqual([0, 2, 4]);
        });

        it('filter with context', function() {
            expect(dp().filter(function(x) {
                return x % 2 === this.value;
            }, {value: 0}).process([0, 1, 2, 3, 4])).toEqual([0, 2, 4]);
        });
    });

    describe('each tests', function() {
        it('Iterating over an array with "each" causes the function to be called with the items of the array as parameter.', function() {
            var res = [];
            dp().each(function(x) {
                res.push(x);
            }).process([0, 1, 2]);
            expect(res).toEqual([0, 1, 2]);
        });

        it('each with context', function() {
            var res = [];
            dp().each(function(x) {
                this.push(x);
            }, res).process([0, 1, 2]);
            expect(res).toEqual([0, 1, 2]);
        });

        it('each should not create a new array', function() {
            var arr = [1, 2, 3];
            expect(dp()
                .each(function() {
                })
                .process(arr)
            ).toBe(arr);
        });
    });

    describe('reduce tests', function() {
        it('Calling reduce should work as expected.', function() {
            expect(dp().reduce(function(memo, x) {
                return memo + x;
            }, '').process(['1', '2', '3', '4', '5'])).toBe('12345');
        });

        it('reduce with context', function() {
            expect(dp().reduce(function(memo, x) {
                return memo + x + this.value;
            }, '', {value: '-'}).process(['1', '2', '3', '4', '5'])).toBe('1-2-3-4-5-');
        });

        it('Calling reduce with a non-primitive non-function object should fail', function() {
            expect(function() {
                dp().reduce(function() {
                }, []);
            }).toThrow();
        });

        it('Calling reduce with a provider function', function() {
            var collect = dp().reduce(function(memo, x) {
                memo.push(x);
                return memo;
            }, function() {
                return [];
            });

            expect(collect.process([1, 2, 3])).toEqual([1, 2, 3]);
            expect(collect.process([4, 5, 6])).toEqual([4, 5, 6]);
        });
    });


    describe('reduceRight tests', function() {
        it('Calling reduceRight should work as expected.', function() {
            expect(dp().reduceRight(function(memo, x) {
                return memo + x;
            }, '').process(['a', 'b', 'c', 'd', 'e'])).toBe('edcba');
        });

        it('reduceRight with context', function() {
            expect(dp().reduceRight(function(memo, x) {
                return memo + x + this.value;
            }, '', {value: '-'}).process(['a', 'b', 'c', 'd', 'e'])).toBe('e-d-c-b-a-');
        });
    });


    describe('Test "find"', function() {
        it('Calling find should return the first item in the array matching the predicate.', function() {
            expect(dp().find(function(x) {
                return x % 3 === 0;
            }).process([1, 2, 3, 4, 5, 6])).toBe(3);
        });

        it('find with context', function() {
            expect(dp().find(function(x) {
                return x % this.value === 0;
            }, {value: 3}).process([1, 2, 3, 4, 5, 6])).toBe(3);
        });

        it('Calling find should return undefined when no items in the array are matching the predicate.', function() {
            expect(dp().find(function(x) {
                return x % 4 === 0;
            }).process([1, 2, 3])).toBeUndefined()
        });
    });

    describe('take tests', function() {
        it('Calling take should work as expected.', function() {
            expect(dp().take(3).process([1, 2, 3, 4, 5, 6])).toEqual([1, 2, 3]);
        });

        it('take with object', function() {
            expect(dp().take(3).process({a: 1, b: 2, c: 3, d: 4, e: 5, f: 6})).toEqual([1, 2, 3]);
        });
    });

    describe('where tests', function() {
        it('Calling where should work as expected.', function() {
            expect(dp().where({x: 1}).process([{x: 1}, {x: 2, y: 3}, {x: 1, y: 4}])).toEqual([{x: 1}, {x: 1, y: 4}]);
        });

        it('special property names', function() {
            var properties = {'\'\n\r\\': 1};
            expect(dp().where(properties).process([{'\'\n\r\\': 1}]).length).toEqual(1);
            expect(dp().where(properties).process([{'\'\n\r\\': 2}]).length).toEqual(0);
        });

        it('where filter should not consider prototype properties', function() {
            function Props() {
            }

            Props.prototype.x = 1;

            var properties = new Props();
            properties.y = 2;
            expect(dp()
                .where(properties)
                .process([{x: 1, y: 2}, {x: 2, y: 2}, {x: 1, y: 1}, {x: 2, y: 1}])
            ).toEqual([{x: 1, y: 2}, {x: 2, y: 2}]);
        });
    });

    it('Calling findWhere should work as expected.', function() {
        expect(dp().findWhere({x: 1}).process([{x: 2}, {x: 1, y: 3}, {x: 1, y: 4}])).toEqual({x: 1, y: 3});

        expect(dp().findWhere({x: 1}).process([{x: 2}, {x: 2, y: 3}])).toBeUndefined();
    });

    describe('reject tests', function() {
        it('Rejecting an array should return an array of the items NOT matching the predicate.', function() {
            expect(dp().reject(function(x) {
                return x % 2 === 0;
            }).process([0, 1, 2, 3, 4, 5])).toEqual([1, 3, 5]);
        });

        it('reject with context', function() {
            expect(dp().reject(function(x) {
                return x % 2 === this.value;
            }, {value: 0}).process([0, 1, 2, 3, 4, 5])).toEqual([1, 3, 5]);
        });
    });

    describe('every tests', function() {
        it('every should return true if all of the elements match the predicate', function() {
            expect(dp()
                .every(function(x) {
                    return x % 2 === 0;
                })
                .process([2, 4, 6, 8])
            ).toBe(true);
        });

        it('every with context', function() {
            expect(dp()
                .every(function(x) {
                    return x % this.value === 0;
                }, {value: 2})
                .process([2, 4, 6, 8])
            ).toBe(true);
        });

        it('every should return true on empty arrays', function() {
            expect(dp()
                .every(function() {
                    throw new Error('Predicate called on what?');
                })
                .process([])
            ).toBe(true);
        });

        it('every should return false if any of the elements does not match the predicate', function() {
            expect(dp()
                .every(function(x) {
                    return x % 2 === 0;
                })
                .process([2, 4, 5, 8])
            ).toBe(false);
        });
    });

    describe('some tests', function() {

        it('some should return false if none of the elements match the predicate', function() {
            expect(dp()
                .some(function(x) {
                    return x % 2 === 0;
                })
                .process([1, 3, 5, 7])
            ).toBe(false);
        });

        it('some with context', function() {
            expect(dp()
                .some(function(x) {
                    return x % this.value === 0;
                }, {value: 2})
                .process([1, 3, 5, 7])
            ).toBe(false);
        });

        it('some should return false on empty arrays', function() {
            expect(dp()
                .some(function() {
                    throw new Error('Predicate called on what?');
                })
                .process([])
            ).toBe(false);
        });

        it('some should return true if any of the elements match the predicate', function() {
            expect(dp()
                .some(function(x) {
                    return x % 2 === 0;
                })
                .process([1, 3, 4, 5])
            ).toBe(true);
        });
    });

    describe('contains tests', function() {
        it('Calling contains on an array which contains the item should return true.', function() {
            expect(dp()
                .contains(1)
                .process([0, 1, 2])
            ).toBe(true);
        });

        it('Calling contains on an array which does not contain the item should return false.', function() {
            expect(dp()
                .contains(3)
                .process([0, 1, 2])
            ).toBe(false);
        });

        it('Calling contains on an empty array should return false.', function() {
            expect(dp()
                .contains(1)
                .process([])
            ).toBe(false);
        });
    });

    describe('flatten tests', function() {
        it('should flatten the array', function() {
            expect(dp()
                .flatten(true)
                .process([[1, 2], [3, [4]]])
            ).toEqual([1, 2, 3, [4]]);
        });

        it('flatten should work with non-array values', function() {
            expect(dp()
                .flatten()
                .process([1, 2, [3, 4]])
            ).toEqual([1, 2, 3, 4]);

            expect(dp()
                .flatten(true)
                .process([1, 2, [3, 4]])
            ).toEqual([1, 2, 3, 4]);
        });

        it('flatten should work deep when the first parameter is not true', function() {
            expect(dp()
                .flatten()
                .process([1, 2, [3, [4]]])
            ).toEqual([1, 2, 3, 4]);
        });
    });

    describe('invoke tests', function() {
        it('invoking methods without parameter', function() {
            expect(dp()
                .invoke('toString')
                .process([1, {
                    toString: function() {
                        return '2';
                    }
                }, [3, 4]])
            ).toEqual(['1', '2', '3,4']);
        });

        it('invoking methods with parameters', function() {
            expect(dp()
                .invoke('method', 'x', 'y')
                .process([{
                    method: function(x, y) {
                        return x + y
                    }
                }, {
                    method: function(x) {
                        return x
                    }
                }])
            ).toEqual(['xy', 'x']);
        });

        it('invoking methods when some objects does not have the method and some of them has null-like values', function() {
            expect(dp()
                .invoke('toFixed')
                .process(['1', 1, {toFixed: null}])
            ).toEqual([void 0, '1', null]);
        });

        it('invoking method when it is a function', function() {
            expect(dp()
                .invoke(function(x) {
                    return this.x + x;
                }, 1)
                .process([{x: 0}, {x: ''}])
            ).toEqual([1, '1']);
        });
    });

    it('pluck should work as expected, even with null-like values', function() {
        expect(dp()
            .pluck('x')
            .process([{x: 0}, {}, null])
        ).toEqual([0, void 0, void 0]);
    });

    describe('min tests', function() {
        it('min should work as expected', function() {
            expect(dp()
                .min()
                .process([5, 6, 3, 2, 4])
            ).toBe(2);
        });

        it('min with iteratee', function() {
            expect(dp()
                .min(function(x) {
                    return x.x;
                })
                .process([{x: 3}, {x: 2}, {x: 1}, {x: 4}])
            ).toEqual({x: 1});
        });

        it('min with context', function() {
            expect(dp()
                .min(function(x) {
                    return x[this];
                }, 'x')
                .process([{x: 3}, {x: 2}, {x: 1}, {x: 4}])
            ).toEqual({x: 1});
        });

        it('min with property', function() {
            expect(dp()
                .min('x')
                .process([{x: 3}, {x: 2}, {x: 1}, {x: 4}])
            ).toEqual({x: 1});
        });

        it('min with 0 element', function() {
            expect(dp()
                .min()
                .process([])
            ).toBe(Infinity);

            expect(dp()
                .min(function(x) {
                    return x.x;
                })
                .process([])
            ).toBe(Infinity);
        });
    });

    describe('max tests', function() {
        it('max should work as expected', function() {
            expect(dp()
                .max()
                .process([5, 6, 3, 2, 4])
            ).toBe(6);
        });

        it('max with iteratee', function() {
            expect(dp()
                .max(function(x) {
                    return x.x;
                })
                .process([{x: 3}, {x: 2}, {x: 4}, {x: 1}])
            ).toEqual({x: 4});
        });

        it('max with context', function() {
            expect(dp()
                .max(function(x) {
                    return x[this];
                }, 'x')
                .process([{x: 3}, {x: 2}, {x: 4}, {x: 1}])
            ).toEqual({x: 4});
        });

        it('max with property', function() {
            expect(dp()
                .max('x')
                .process([{x: 3}, {x: 2}, {x: 4}, {x: 1}])
            ).toEqual({x: 4});
        });

        it('max with 0 element', function() {
            expect(dp()
                .max()
                .process([])
            ).toBe(-Infinity);

            expect(dp()
                .max(function(x) {
                    return x.x;
                })
                .process([])
            ).toBe(-Infinity);
        });
    });

    describe('groupBy tests', function() {
        var data = [{x: 1, y: 2}, {z: 1}, {a: 3, x: 1}, {x: 2, y: 3}];
        var afterGroup = {
            1: [{x: 1, y: 2}, {a: 3, x: 1}],
            2: [{x: 2, y: 3}],
            undefined: [{z: 1}]
        };

        it('groupBy with property name', function() {
            expect(dp()
                .groupBy('x')
                .process(data)
            ).toEqual(afterGroup);
        });

        it('groupBy with function', function() {
            expect(dp()
                .groupBy(function(x) {
                    return x.x;
                })
                .process(data)
            ).toEqual(afterGroup);
        });

        it('groupBy with context', function() {
            expect(dp()
                .groupBy(function(x) {
                    return x[this];
                }, 'x')
                .process(data)
            ).toEqual(afterGroup);
        });
    });

    describe('indexBy tests', function() {
        var data = [{x: 1, y: 2}, {z: 1}, {a: 3, x: 1}, {x: 2, y: 3}];
        var afterInfex = {
            1: {a: 3, x: 1},
            2: {x: 2, y: 3},
            undefined: {z: 1}
        };

        it('indexBy with property name', function() {
            expect(dp()
                .indexBy('x')
                .process(data)
            ).toEqual(afterInfex);
        });

        it('indexBy with function', function() {
            expect(dp()
                .indexBy(function(x) {
                    return x.x;
                })
                .process(data)
            ).toEqual(afterInfex);
        });

        it('indexBy with context', function() {
            expect(dp()
                .indexBy(function(x) {
                    return x[this];
                }, 'x')
                .process(data)
            ).toEqual(afterInfex);
        });
    });

    describe('sortBy tests', function() {
        it('sortBy without parameters should return a simple sorted array.', function() {
            expect(dp()
                .sortBy()
                .process([3, 6, 2, 4, 1, 5])
            ).toEqual([1, 2, 3, 4, 5, 6]);
        });

        it('sortBy with rank provider.', function() {
            expect(dp()
                .sortBy(function(x) {
                    return Math.sin(x);
                })
                .process([1, 2, 3, 4, 5, 6])
            ).toEqual([5, 4, 6, 3, 1, 2]);
        });

        it('sortBy with context', function() {
            expect(dp()
                .sortBy(function(x) {
                    return this.sin(x);
                }, Math)
                .process([1, 2, 3, 4, 5, 6])
            ).toEqual([5, 4, 6, 3, 1, 2]);
        });

        it('sortBy with property name.', function() {
            expect(dp()
                .sortBy('x')
                .process([{x: 2}, {x: 1, y: 2}, {x: 3}, {y: 1}])
            ).toEqual([{x: 1, y: 2}, {x: 2}, {x: 3}, {y: 1}]);
        });

        it('sortBy does not modify the original array', function() {
            var array = [3, 1, 2];
            dp()
                .sortBy()
                .process(array);
            dp()
                .each(function() {
                })
                .sortBy()
                .process(array);
            expect(array).toEqual([3, 1, 2])
        });

        it('sortBy does not copy the array when the array is created by a previous step.', function() {
            expect(dp()
                .take(2)
                .sortBy()
                .fn()
                .toString()
            ).not.toContain('slice');
        });

        it('shortBy should work on objects', function() {
            expect(dp()
                .sortBy()
                .process({a: 2, b: 1, c: 3})
            ).toEqual([1, 2, 3]);
        });
    });

    describe('countBy tests', function() {
        it('countBy without parameters', function() {
            expect(dp()
                .countBy()
                .process([1, 2, 1, 3, 3])
            ).toEqual({
                1: 2,
                2: 1,
                3: 2
            });
        });

        it('countBy with property name', function() {
            expect(dp()
                .countBy('x')
                .process([{x: 1}, {x: 2}, {x: 1}, {x: 3}, {x: 3}])
            ).toEqual({
                1: 2,
                2: 1,
                3: 2
            });
        });

        it('countBy with function', function() {
            expect(dp()
                .countBy(function(x) {
                    return x % 2 === 0 ? 'even' : 'odd';
                })
                .process([1, 2, 3, 4, 5])
            ).toEqual({
                even: 2,
                odd: 3
            });
        });

        it('countBy with context', function() {
            expect(dp()
                .countBy(function(x) {
                    return x % this.value === 0 ? 'even' : 'odd';
                }, {value: 2})
                .process([1, 2, 3, 4, 5])
            ).toEqual({
                even: 2,
                odd: 3
            });
        });
    });
});

describe('Test functions with chaining', function() {
    it('map and filter', function() {
        expect(dp()
            .map(tenTimes)
            .filter(function(x) {
                return x % 20 === 0;
            })
            .process([1, 2, 3, 4])).toEqual([20, 40]);
    });

    it('map and each', function() {
        var result = [];
        dp()
            .map(tenTimes)
            .each(function(x) {
                result.push(x);
            })
            .process([1, 2, 3, 4]);

        expect(result).toEqual([10, 20, 30, 40]);
    });

    it('map and reduce', function() {
        expect(dp()
            .map(tenTimes)
            .reduce(function(memo, x) {
                return memo + x;
            }, '')
            .process([1, 2, 3, 4])).toEqual('10203040');
    });

    it('map and reduceRight', function() {
        expect(dp()
            .map(tenTimes)
            .reduceRight(function(memo, x) {
                return memo + x;
            }, '')
            .process([1, 2, 3, 4])).toEqual('40302010');
    });


    describe('Chaining with take', function() {

        it('map and take', function() {
            expect(dp()
                .map(tenTimes)
                .take(2)
                .process([1, 2, 3, 4])).toEqual([10, 20]);
        });

        it('filter and take', function() {
            expect(dp()
                .filter(function(x) {
                    return x % 2 === 0;
                })
                .take(2)
                .process([1, 2, 3, 4, 5, 6, 7])).toEqual([2, 4]);
        });

        it('filter, take, filter, take', function() {
            expect(dp()
                .filter(function(x) {
                    return x % 2 === 0;
                })
                .take(10)
                .filter(function(x) {
                    return x !== 4;
                })
                .take(2)
                .process([1, 2, 3, 4, 5, 6, 7, 8, 9])).toEqual([2, 6]);
        });

        it('filter, take, take', function() {
            expect(dp()
                .filter(function(x) {
                    return x % 2 === 0;
                })
                .take(3)
                .take(2)
                .process([1, 2, 3, 4, 5, 6, 7, 8, 9])).toEqual([2, 4]);
        });
    });

    it('sortBy twice', function() {
        expect(dp()
            .sortBy('y')
            .sortBy('x')
            .pluck('y')
            .process([{x: 2, y: 3}, {x: 1, y: 2}, {x: 3, y: 1}])
        ).toEqual([2, 3, 1])
    });
});

function tenTimes(x) {
    return x * 10;
}

var dp = require('../dist/datapipe');

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
});

describe('Test functions without chaining', function() {
    it('Mapping an array should return an array with items mapped with the function.', function() {
        expect(dp().map(function(x) {
            return x + 1;
        }).process([-1, 0, 1])).toEqual([0, 1, 2]);
    });

    it('Filtering an array should return an array of the items matching the predicate.', function() {
        expect(dp().filter(function(x) {
            return x % 2 === 0;
        }).process([0, 1, 2, 3, 4])).toEqual([0, 2, 4]);
    });

    it('Iterating over an array with "each" causes the function to be called with the items of the array as parameter.', function() {
        var res = [];
        dp().each(function(x) {
            res.push(x);
        }).process([0, 1, 2]);
        expect(res).toEqual([0, 1, 2]);
    });

    it('Calling reduce should work as expected.', function() {
        expect(dp().reduce(function(memo, x) {
            return memo + x;
        }, '').process(['1', '2', '3', '4', '5'])).toBe('12345');
    });

    it('Calling reduce with a non-primitive non-function object should fail', function() {
        expect(function() {
            dp().reduce(function() {
            }, []);
        }).toThrow();
    });

    it('Calling reduce with a provider function should ', function() {
        var collect = dp().reduce(function(memo, x) {
            memo.push(x);
            return memo;
        }, function() {
            return [];
        });

        expect(collect.process([1, 2, 3])).toEqual([1, 2, 3]);
        expect(collect.process([4, 5, 6])).toEqual([4, 5, 6]);
    });

    it('Calling reduceRight should work as expected.', function() {
        expect(dp().reduceRight(function(memo, x) {
            return memo + x;
        }, '').process(['a', 'b', 'c', 'd', 'e'])).toBe('edcba');
    });

    describe('Test "find"', function() {
        it('Calling find should return the first item in the array matching the predicate.', function() {
            expect(dp().find(function(x) {
                return x % 3 === 0;
            }).process([1, 2, 3, 4, 5, 6])).toBe(3);
        });

        it('Calling find should return undefined when no items in the array are matching the predicate.', function() {
            expect(dp().find(function(x) {
                return x % 4 === 0;
            }).process([1, 2, 3])).toBeUndefined()
        });
    });

    it('Calling take should work as expected.', function() {
        expect(dp().take(3).process([1, 2, 3, 4, 5, 6])).toEqual([1, 2, 3]);
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
    });

    it('Calling findWhere should work as expected.', function() {
        expect(dp().findWhere({x: 1}).process([{x: 2}, {x: 1, y: 3}, {x: 1, y: 4}])).toEqual({x: 1, y: 3});

        expect(dp().findWhere({x: 1}).process([{x: 2}, {x: 2, y: 3}])).toBeUndefined();
    });

    it('Rejecting an array should return an array of the items NOT matching the predicate.', function() {
        expect(dp().reject(function(x) {
            return x % 2 === 0;
        }).process([0, 1, 2, 3, 4, 5])).toEqual([1, 3, 5]);
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

        it('sortBy with property name.', function() {
            expect(dp()
                .sortBy('x')
                .process([{x: 2}, {x: 1, y: 2}, {x: 3}, {y: 1}])
            ).toEqual([{x: 1, y: 2}, {x: 2}, {x: 3}, {y: 1}]);
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
});

function tenTimes(x) {
    return x * 10;
}

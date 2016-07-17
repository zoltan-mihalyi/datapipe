import CollectionsDataPipe = require("./collections-datapipe");
import DataPipe = require("../datapipe");
import {CollectionType} from "../../common";
import {
    result,
    prop,
    literal,
    setResult,
    undef,
    empty,
    seq,
    current,
    br,
    conditional,
    gt,
    arrayIndex,
    param,
    gte,
    ternary,
    subtract,
    cont,
    lt,
    named,
    rename,
    index,
    callParam,
    and,
    declare,
    itar,
    assign,
    add,
    call,
    array,
    eq,
    neq,
    access,
    iterSimple,
    newArray,
    length,
    obj,
    iter,
    statement,
    toInt,
    divide,
    par
} from "../../code-helpers";
import {
    ResultCreation,
    filterMapBefore,
    filterMapAfter,
    optimizeMap,
    NEEDS_SAME,
    DataPipeResult,
    toAccessible,
    flattenTo
} from "../datapipe-common";
import ObjectsDataPipe = require("./objects-datapipe");

abstract class ArraysDataPipe<R,T> extends ObjectsDataPipe<R,T> {
    head:typeof ArraysDataPipe.prototype.first;
    take:typeof ArraysDataPipe.prototype.first;

    first(cnt?:number):DataPipe<R,T> {
        //todo if length >= data.length, do nothing
        if (cnt == null) {
            return this.subPipe<T>(CollectionType.UNKNOWN, {
                createCode: (ctx:Context) => {
                    if (ctx.array) {
                        return setResult(prop(result, literal(0)));
                    }

                    return {
                        rename: true,
                        before: setResult(undef),
                        after: empty,
                        text: seq([
                            setResult(current),
                            br
                        ]),
                        mergeStart: true,
                        mergeEnd: false
                    };
                },
                handlesSize: false
            }, ResultCreation.EXISTING_OBJECT);
        }

        return this.subPipe<T>(CollectionType.ARRAY, {
            createCode: (ctx:Context, needs:Needs) => {
                if (needs.size) {
                    return conditional(
                        gt(result, literal(cnt)),
                        setResult(literal(cnt))
                    );
                }

                var loop:Loop = {
                    rename: true, //todo calculate from codeText?
                    before: filterMapBefore,
                    after: filterMapAfter,
                    text: conditional(
                        gte(arrayIndex, param(cnt)),
                        br
                    ),
                    mergeStart: true,
                    mergeEnd: true
                };

                if (ctx.array && !(ctx.loop && ctx.loop.lengthDirty)) {
                    loop.range = {
                        definesStart: false,
                        relativeToStart: true,
                        value: cnt
                    };
                    loop.text = empty;
                }

                optimizeMap(loop, ctx);

                return loop;
            },
            handlesSize: true
        }, ResultCreation.NEW_OBJECT, NEEDS_SAME);
    }

    initial(cnt?:number):DataPipe<R,T> {
        if (this.type !== CollectionType.ARRAY) {
            return this.toArray().initial(cnt);
        }
        if (cnt == null) {
            cnt = 1;
        }
        return this.subPipe<T>(CollectionType.ARRAY, {
            createCode: (ctx:Context, needs:Needs) => {
                if (needs.size) { //todo duplication
                    return setResult(ternary(
                        gt(result, literal(cnt)),
                        subtract(result, literal(cnt)),
                        literal(0)
                    ));
                }

                var loop:Loop = {
                    rename: true,
                    before: filterMapBefore,
                    after: filterMapAfter,
                    text: empty,
                    mergeStart: ctx.array,
                    mergeEnd: true,
                    range: {
                        definesStart: false,
                        relativeToStart: false,
                        value: cnt
                    }
                };

                optimizeMap(loop, ctx);

                return loop;
            },
            handlesSize: true
        }, ResultCreation.NEW_OBJECT, NEEDS_SAME);
    }

    last(cnt?:number):DataPipe<R,T> { //todo very similar to first
        if (this.type !== CollectionType.ARRAY) {
            return this.toArray().last(cnt);
        }
        if (cnt == null) {
            let text = setResult(prop(result, subtract(prop<number>(result, 'length'), literal(1))));
            return this.subPipe<T>(CollectionType.UNKNOWN, text, ResultCreation.EXISTING_OBJECT);
        }

        return this.subPipe<T>(CollectionType.ARRAY, {
            createCode: (ctx:Context, needs:Needs) => {
                if (needs.size) { //todo duplication
                    return conditional(
                        gt(result, literal(cnt)),
                        setResult(literal(cnt))
                    );
                }

                var loop:Loop = {
                    rename: true,
                    before: filterMapBefore,
                    after: filterMapAfter,
                    text: empty,
                    mergeStart: ctx.array,
                    mergeEnd: true,
                    range: {
                        definesStart: true,
                        relativeToStart: false,
                        value: cnt
                    }
                };

                optimizeMap(loop, ctx);

                return loop;
            },
            handlesSize: true
        }, ResultCreation.NEW_OBJECT, NEEDS_SAME);
    }

    tail:typeof ArraysDataPipe.prototype.rest;
    drop:typeof ArraysDataPipe.prototype.rest;

    rest(cnt?:number):DataPipe<R,T> {
        if (cnt == null) {
            cnt = 1;
        }
        return this.subPipe<T>(CollectionType.ARRAY, {
            createCode: (ctx:Context, needs:Needs) => {
                if (needs.size) {
                    return setResult(
                        ternary(
                            gt(result, literal(cnt)),
                            subtract(result, literal(cnt)),
                            literal(0)
                        )
                    );
                }

                var loop:Loop = {
                    rename: true,
                    before: filterMapBefore,
                    after: filterMapAfter,
                    text: conditional(
                        lt(arrayIndex, literal(cnt)),
                        cont
                    ),
                    mergeStart: true,
                    mergeEnd: true
                };

                if (ctx.array && !(ctx.loop && ctx.loop.lengthDirty)) {
                    loop.range = {
                        definesStart: true,
                        relativeToStart: true,
                        value: cnt
                    };
                    loop.text = empty;
                }

                optimizeMap(loop, ctx);

                return loop;
            },
            handlesSize: true
        }, ResultCreation.NEW_OBJECT, NEEDS_SAME); //todo change range
    }

    compact():DataPipe<R,T> {
        return this.filterLike(current, null, false);
    }

    flatten(shallow?:boolean):DataPipe<R,any> {
        if (shallow) {
            var offset = named<number>('offset');
            var subIndex = rename(index, 1);
            var text:CodeText<any> = conditional(
                and(current, callParam(Array.isArray, null)),
                seq([
                    declare(offset, prop(result, 'length')),
                    itar(
                        empty,
                        current,
                        assign(prop(result, add(offset, subIndex)), prop(current, subIndex)),
                        {level: 1}
                    )
                ]),
                call(prop<()=>any>(result, 'push'), [current])
            );
            return this.reduceLike(CollectionType.ARRAY, setResult(array()), text, false);
        }
        return this.subPipe<any>(CollectionType.ARRAY, setResult(callParam(flattenTo, null, [result, array()])), ResultCreation.NEW_OBJECT);
    }

    without(...items:any[]):DataPipe<R,T> {
        var filteredItems = [];
        var result:DataPipe<R,T> = this;

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (filteredItems.indexOf(item) !== -1) {
                continue;
            }
            filteredItems.push(item);
            result = result.filterLike(eq(current, param(item)), null, true); //todo generate shorter code using OR
        }

        return result;
    }

    union(...arrays:T[][]):DataPipe<R,T> {
        var unique:T[] = [];
        var statements:CodeText<void>[] = [];
        for (var i = 0; i < arrays.length; i++) {
            var array:T[] = arrays[i];
            for (var j = 0; j < array.length; j++) {
                var item = array[j];
                if (unique.indexOf(item) !== -1) {
                    continue;
                }
                unique.push(item);
                statements.push(conditional(
                    eq(call(prop<()=>number>(result, 'indexOf'), [param(item)]), literal(-1)),
                    call(prop<()=>any>(result, 'push'), [param(item)])
                ));
            }
        }
        return this.uniq().subPipe<T>(CollectionType.ARRAY, seq(statements), ResultCreation.NEW_OBJECT);
    }

    intersection(...arrays:T[][]):DataPipe<R,T> {
        if (arrays.length === 0) {
            return this.uniq();
        }

        var items:T[] = [];

        var first = arrays[0];
        outer:for (var i = 0; i < first.length; i++) {
            var item = first[i];
            if (items.indexOf(item) !== -1) {
                continue;
            }
            for (var j = 1; j < arrays.length; j++) {
                let array = arrays[j];
                if (array.indexOf(item) === -1) {
                    continue outer;
                }
            }
            items.push(item);
        }

        var predicate:CodeText<boolean>;

        for (let i = 0; i < items.length; i++) {
            let item = items[i];
            let subCondition = neq(current, param(item));
            if (predicate) {
                predicate = and(predicate, subCondition);
            } else {
                predicate = subCondition;
            }
        }

        var unique = this.uniq();
        if (items.length) {
            return unique.filterLike(predicate, null, true);
        } else {
            return unique.subPipe<T>(CollectionType.ARRAY, {//todo move this branch to filterLike as a special case?
                createCode: (ctx:Context, needs:Needs) => {
                    if (needs.size) {
                        return setResult(literal(0));
                    }
                    return {
                        rename: true,
                        changesIndex: true,
                        before: filterMapBefore,
                        after: filterMapAfter,
                        text: cont,
                        mergeStart: true,
                        mergeEnd: true
                    };
                },
                handlesSize: true
            }, ResultCreation.NEW_OBJECT);
        }
    }

    difference(...arrays:any[]):DataPipe<R,T> {
        var concatenated = [];
        for (var i = 0; i < arrays.length; i++) {
            var array = arrays[i];
            Array.prototype.push.apply(concatenated, array);
        }
        return this.without.apply(this, concatenated);
    }

    unique:typeof ArraysDataPipe.prototype.uniq;

    uniq(isSorted:boolean, iteratee?:Iteratee<T,any>, context?:any):DataPipe<R,T>;
    uniq(iteratee?:Iteratee<T,any>, context?:any):DataPipe<R,T>;
    uniq(isSorted?:boolean|Iteratee<T,any>, iteratee?:Iteratee<T,any>, context?:any):DataPipe<R,T> {
        if (typeof isSorted !== 'boolean') {
            context = iteratee;
            iteratee = isSorted as Iteratee<T,any>;
            isSorted = false;
        }
        var seen = named<any[]>('seen');
        //todo we cannot merge into the existing loop!
        var target = this.subPipe<T>(this.type, declare(seen, array()), ResultCreation.USES_PREVIOUS);

        var computed:CodeText<any>;
        var declareComputed:CodeText<any>;
        if (iteratee == null) {
            computed = current;
            declareComputed = null;
        } else {
            computed = named<any>('computed');
            declareComputed = declare(computed, access(toAccessible(iteratee), context));
        }

        var markAsSeen:CodeText<any>;
        var predicate:CodeText<boolean>;
        if (isSorted) {
            markAsSeen = assign(seen, computed);
            predicate = eq(seen, computed);
        } else {
            markAsSeen = call(prop(seen, 'push'), [computed]);
            predicate = neq(call(prop<()=>number>(seen, 'indexOf'), [computed]), literal(-1));
        }

        return target.filterLike(predicate, null, true, declareComputed, markAsSeen);
    }

    zip(...arrays:any[][]):DataPipe<R,any[]> {
        var withArrays:CodeText<any>[] = [result]; //todo could be optimized, since there are fix parameters.
        for (var i = 0; i < arrays.length; i++) {
            withArrays.push(param(arrays[i]));
        }
        var code = setResult(array.apply(null, withArrays)); //data = [data,_p0,_p1,...]
        return this.subPipe<T>(CollectionType.ARRAY, code, ResultCreation.NEW_OBJECT).unzip();
    }

    unzip():DataPipe<R,any[]> {
        var dataOldVar = named<any[]>('dataOld');
        var resultLengthVar = named<number>('resultLength');
        var innerIndex = rename(index, 1);
        return this.subPipe<any[]>(CollectionType.ARRAY, seq([
            declare(dataOldVar, result),
            declare(resultLengthVar, literal(0)),
            declare(length, prop(dataOldVar, 'length')),
            iterSimple(length, seq([
                declare(current, prop(prop(dataOldVar, index), 'length')),
                conditional(
                    gt(current, resultLengthVar),
                    assign(resultLengthVar, current)
                )
            ])),
            setResult(newArray(resultLengthVar)),
            iterSimple(resultLengthVar, seq([
                declare(current, assign(prop(result, index), newArray(length))),
                iterSimple(length, assign(prop(current, innerIndex), prop(prop(dataOldVar, innerIndex), index)), 1)
            ]))
        ]), ResultCreation.NEW_OBJECT);
    }

    object(values?:any[]):DataPipe<R,any> {
        var currentArray = current as CodeText<any[]>;
        var text:CodeText<any>;
        if (values) {
            text = assign(prop(result, current), prop(param(values), index));
        } else {
            text = assign(prop(result, prop(currentArray, 0)), prop(currentArray, 1));
        }

        return this.reduceLike(CollectionType.MAP, setResult(obj()), text, false);
    }

    indexOf(item:any, sorted?:boolean):DataPipeResult<R,number> {
        if (!sorted) {
            return this.indexOfLike<number>({item: item});
        }

        return this.sortedIndexLike(item, true);
    }

    lastIndexOf(item:any, fromIndex?:number):DataPipeResult<R,number> {
        var target:this = fromIndex ? this.first(fromIndex) as any : this;
        return target.indexOfLike<number>({item: item, reversed: true});
    }

    sortedIndex(item:any, iteratee?:Iteratee<T,string|number>, context?:any):DataPipeResult<R,number> {
        return this.sortedIndexLike(item, false, iteratee, context);
    }

    findIndex(predicate?:Predicate<T>, context?:any):DataPipeResult<R,number> {
        return this
            .subPipe(CollectionType.ARRAY, empty, ResultCreation.USES_PREVIOUS) //to use result as an array
            .indexOfLike<number>({item: predicate, isPredicate: true, context});
    }

    findLastIndex(predicate?:Predicate<T>, context?:any):DataPipeResult<R,number> {
        return this.indexOfLike<number>({item: predicate, reversed: true, isPredicate: true, context});
    }

    range(start?:number, stop?:number, step?:number):DataPipe<R,number> {
        if (stop == null) { //todo check for infinite loops!
            stop = start;
            start = 0;
        }
        step = step || 1;

        var size = Math.ceil((stop - start) / step);
        var elements:CodeText<number>[] = [];
        for (var i = 0; i < size; i++) {
            elements.push(literal(i * step + start));
        }

        var createArray:CodeText<void> = setResult(array.apply(null, elements));
        return this.subPipe<number>(CollectionType.ARRAY, createArray, ResultCreation.NEW_OBJECT);
    }

    private sortedIndexLike(item:any, exactMatch:boolean, iteratee?:Iteratee<T,string|number>, context?:any):DataPipeResult<R,number> {
        var initializeDefaultValue:CodeText<void>;

        var start = named<number>('start');
        var end = named<number>('end');
        var dataOld = named<any>('dataOld');
        var moveEnd = assign(end, subtract(index, literal(1)));
        var accessible = toAccessible(iteratee);
        var extractResult:CodeText<void>;
        if (exactMatch) {
            initializeDefaultValue = setResult(literal(-1));
            moveEnd = conditional(
                gt(current, param(item)),
                moveEnd,
                seq([setResult(index), br])
            );
            extractResult = empty;
        } else {
            initializeDefaultValue = empty;
            extractResult = assign(result, start);
        }

        var code:CodeText<void> = seq([
            declare(dataOld, result),
            initializeDefaultValue,
            declare(start, literal(0)),
            declare(end, subtract(prop<number>(dataOld, 'length'), literal(1))),
            iter(statement(empty), gte(end, start), empty, seq([
                declare(index, toInt(divide(par(add(start, end)), literal(2)))),
                declare(current, access(accessible, context, prop(dataOld, index))),
                conditional(
                    lt(current, access(accessible, context, param(item))),
                    assign(start, add(index, literal(1))),
                    moveEnd
                ),
            ])),
            extractResult
        ]);
        return this.resultPipe<number>(code, true);
    }
}

ArraysDataPipe.prototype.head = ArraysDataPipe.prototype.take = ArraysDataPipe.prototype.first;
ArraysDataPipe.prototype.unique = ArraysDataPipe.prototype.uniq;
ArraysDataPipe.prototype.tail = ArraysDataPipe.prototype.drop = ArraysDataPipe.prototype.rest;

export = ArraysDataPipe;
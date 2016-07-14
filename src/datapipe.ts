import Accumulator = require("./accumulator");
import {
    assign,
    call,
    param,
    conditional,
    not,
    cont,
    current,
    result,
    undef,
    empty,
    seq,
    br,
    index,
    gte,
    lt,
    array,
    prop,
    ternary,
    eql,
    nullValue,
    infinity,
    negativeInfinity,
    gt,
    declare,
    named,
    setResult,
    falseValue,
    trueValue,
    func,
    ret,
    subtract,
    obj,
    access,
    params,
    neq,
    codeTextToString,
    increment,
    literal,
    cast,
    retSeq,
    statement,
    callParam,
    Operator,
    arrayIndex,
    multiply,
    add,
    par,
    and,
    itar,
    rename,
    itarMapBefore,
    itarMapAfter,
    eq,
    newArray,
    length,
    iterSimple,
    iter,
    divide,
    toInt,
    isObjectConditional,
    neql,
    itin,
    or,
    hasOwnProperty,
    type,
    getParamNames,
    isIn
} from "./code-helpers";
import {CollectionType, Step, ResultCreation} from "./common";
import ChildDataPipe = require("./child-datapipe");

const isArray = Array.isArray;

const filterMapBefore = setResult(array());
const filterMapAfter = call(prop<()=>any>(result, 'push'), [current]);

const filterMapObjectBefore = setResult(obj());
const filterMapObjectAfter = assign(prop(result, index), current);

const NEEDS_SAME:NeedsProvider = (needs:Needs)=> {
    return needs;
};

interface DataPipeResult<R,T> {
    process(data:R[]):T;
    compile():DataPipeResult<R,T>;
}

interface IndexOfLikeParams {
    item:any;
    reversed?:boolean;
    isPredicate?:boolean;
    context?:any;
    defaultValue?:CodeText<any>;
}

type Primitive = string|number|boolean|void;

type Provider<T> = {():T}|Primitive&T;

abstract class DataPipe<R,T> implements DataPipeResult<R,T[]> {
    static ChildDataPipe:typeof ChildDataPipe;

    constructor(public type:CollectionType) {
    }

    map<O>(iteratee?:Iteratee<T,O>, context?:any):DataPipe<R,O> { //todo is there a correlation between fields?
        return this.mapLike<O>(assign(current, access(toAccessible(iteratee), context)));
    }

    filter(predicate?:Predicate<T>, context?:any):DataPipe<R,T> { //todo filter with properties and regexp
        return this.filterLike(predicate, context);
    }

    each(callback:(t?:T)=>any, context?:any):DataPipe<R,T> {
        return this.subPipe<T>(this.type, {
            text: statement(callParam(callback, context)),
            mergeStart: true,
            mergeEnd: true,
            changesLength: false
        }, ResultCreation.USES_PREVIOUS);
    }

    reduce<M>(reducer:(memo:M[], t:T)=>M[], memo:Provider<M[]>):DataPipe<R,M>;
    reduce<M>(reducer:(memo:M, t:T)=>M, memo:Provider<M>):DataPipeResult<R,M>;
    reduce<M>(reducer:(memo:M, t:T)=>M, memo:Provider<M>, context?:any) {
        return this.reduceLikeWithProvider<M>(reducer, memo, context, false);
    }

    reduceRight<M>(reducer:(memo:M[], t:T)=>M[], memo:Provider<M[]>):DataPipe<R,M>;
    reduceRight<M>(reducer:(memo:M, t:T)=>M, memo:Provider<M>):DataPipeResult<R,M>;
    reduceRight<M>(reducer:(memo:M, t:T)=>M, memo:Provider<M>, context?:any) {
        return this.reduceLikeWithProvider<M>(reducer, memo, context, true);
    }

    find(predicate?:Predicate<T>, context?:any):DataPipeResult<R,T> {
        return this.subPipe(CollectionType.UNKNOWN, {
            rename: true,
            before: setResult(undef),
            after: empty,
            text: conditional(
                access(toAccessible(predicate), context),
                seq([
                    setResult(current),
                    br
                ])
            ),
            mergeStart: true,
            mergeEnd: false
        }, ResultCreation.EXISTING_OBJECT) as any;
    }

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

    rest(cnt?:number):DataPipe<R,T> { //todo tail, drop
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

    compact():DataPipe<R,T> {
        return this.filterLike(current, null, false);
    }

    where(properties:Properties):DataPipe<R,T> {
        return this.filter(whereFilter(properties));
    }

    findWhere(properties:Properties):DataPipeResult<R,any> {
        return this.find(whereFilter(properties));
    }

    reject(predicate?:Predicate<T>, context?:any):DataPipe<R,T> {
        return this.filterLike(predicate, context, true);
    }

    every(predicate?:Predicate<T>, context?:any):DataPipeResult<R, boolean> {
        return this.everyLike(predicate, context);
    }

    some(predicate?:Predicate<T>, context?:any):DataPipeResult<R, boolean> {
        return this.everyLike(predicate, context, true);
    }

    contains(value:T):DataPipeResult<R, boolean> {
        return this.some(x => x === value); //todo fromIndex parameter, use indexOf if not merged
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

    invoke(method:string, ...methodArgs:any[]):DataPipe<R,any>;
    invoke<O>(method:(...args:any[]) => O, ...methodArgs:any[]):DataPipe<R,O>;
    invoke(method:string|(()=>any), ...methodArgs:any[]) {
        var newValue:CodeText<any>;
        var methodParams = params(methodArgs);
        if (typeof method === 'string') {
            let access = prop<()=>any>(current, method);
            newValue = ternary(
                eql(access, nullValue),
                access,
                call(access, methodParams)
            );
        } else {
            newValue = call(param(method), methodParams, current);
        }

        return this.mapLike(assign(current, newValue));
    }

    pluck(property:string|number):DataPipe<R,any> {
        return this.mapLike<any>(assign(current,
            ternary<any>(
                eql(current, nullValue),
                undef,
                prop(current, property)
            )
        ));
    }

    min(iteratee:Iteratee<T,number>):DataPipeResult<R, T>;
    min():DataPipeResult<R, number>;
    min(iteratee?:Iteratee<T,number>, context?:any) {
        return this.edge(infinity, lt, iteratee, context);
    }

    max(iteratee:Iteratee<T,number>):DataPipeResult<R, T>;
    max():DataPipeResult<R, number>;
    max(iteratee?:Iteratee<T,number>, context?:any) {
        return this.edge(negativeInfinity, gt, iteratee, context);
    }

    groupBy(iteratee?:Iteratee<T,string|number>, context?:any):DataPipe<R,T[]> {
        var group = named<string>('group');
        var text:CodeText<any> = seq([
            declare(group, access(toAccessible(iteratee), context)),
            ternary<any>(
                prop<boolean>(result, group),
                call(prop(prop<any[]>(result, group), 'push'), [current]),
                assign(prop(result, group), array(current))
            )
        ]);

        return this.reduceLike<T[]>(CollectionType.MAP, setResult(obj()), text, false);
    }

    indexBy(iteratee?:Iteratee<T,string|number>, context?:any):DataPipe<R,T> {
        var assignment = assign(prop(result, access(toAccessible(iteratee), context)), current);
        return this.reduceLike<T>(CollectionType.MAP, setResult(obj()), assignment, false); //todo dont care order?
    }

    sortBy(iteratee?:Iteratee<T,string|number>, context?:any):DataPipe<R,T> {
        //todo advanced logic, when used after map-like processors
        var text:CodeText<any>;
        if (!this.hasNewResult() || this.type !== CollectionType.ARRAY) {
            return this.toArray().sortBy(iteratee, context);
        }
        if (!iteratee) {
            text = statement(call(prop<()=>any>(result, 'sort')), true);
        } else {
            var accessible = toAccessible(iteratee);
            text = statement(call(prop<()=>any>(result, 'sort'), [func(['a', 'b'],
                ret(subtract(
                    access(accessible, context, named('a')),
                    access(accessible, context, named('b'))
                ))
            )]), true); //todo cache values??
        }
        return this.subPipe<T>(CollectionType.ARRAY, text, ResultCreation.NEW_OBJECT);
    }

    countBy(iteratee?:Iteratee<T,number>, context?:any):DataPipe<R,number> {
        var group:CodeText<any>;
        var firstStatement = empty;
        if (!iteratee) {
            group = current;
        } else {
            group = named('group');
            firstStatement = declare(group, access(toAccessible(iteratee), context));
        }
        var count = prop<number>(result, group);
        return this.reduceLike<number>(CollectionType.MAP, setResult(obj()), seq([
            firstStatement,
            ternary<any>(
                cast<boolean>(count),
                increment(count),
                assign(count, literal(1))
            )
        ]), false);
    }

    shuffle():DataPipe<R,T> {
        if (this.type !== CollectionType.ARRAY) {
            return this.toArray().shuffle(); //todo
        }
        var rand:CodeText<number> = named<number>('random');
        var math:CodeText<{[index:string]:()=>number}> = named<any>('Math');
        var random:CodeText<number> = multiply(call(prop(math, 'random')), par(add(index, literal(1))));
        var flooredRandom:CodeText<number> = call(prop(math, 'floor'), [random]);

        return this.subPipe<T>(CollectionType.ARRAY, {
            createCode: (ctx:Context, needs:Needs) => {
                if (needs.size) {
                    return empty;
                }

                var loop:Loop = {
                    before: filterMapBefore,
                    text: seq([
                        declare(rand, flooredRandom),
                        conditional(neq(rand, index), assign(prop(result, index), prop(result, rand)))
                    ]),
                    after: assign(prop(result, rand), current),
                    mergeStart: true,
                    mergeEnd: false,
                    rename: true
                };

                optimizeMap(loop, ctx);

                return loop;
            },
            handlesSize: true
        }, ResultCreation.NEW_OBJECT, NEEDS_SAME);
    }

    sample():DataPipeResult<R,T>;
    sample(count:number):DataPipe<R,T>;
    sample(count?:number) { //todo code contains toArray code in array part?
        if (count == null) {
            var math:CodeText<{[index:string]:()=>number}> = named<any>('Math');
            var code = setResult(prop(result, toInt(multiply(call(prop(math, 'random')), prop<number>(result, 'length')))));
            return this.toArray().subPipe(CollectionType.UNKNOWN, code, ResultCreation.EXISTING_OBJECT) as any;
        }
        return this.shuffle().first(count); //todo should be faster
    }

    toArray():DataPipe<R,T> {
        return this.mapLike<T>(empty); //todo optimize here, not in the accumulator
    }

    size():DataPipe<R,T> {
        return this.subPipe<T>(CollectionType.UNKNOWN, empty, ResultCreation.NEW_OBJECT, ()=> {
            return {
                size: true
            };
        });
    }

    partition(predicate?:Predicate<T>, context?:any) { //todo predicate type with index and list
        var part1 = named('part1');
        var part2 = named('part2');
        return this.subPipe(CollectionType.UNKNOWN, {
            before: seq([
                declare(part1, array()),
                declare(part2, array())
            ]),
            text: statement(ternary(
                access(toAccessible(predicate), context),
                call(prop<any>(part1, 'push'), [current]),
                call(prop<any>(part2, 'push'), [current])
            )),
            mergeStart: true,
            mergeEnd: false
        }, ResultCreation.USES_PREVIOUS).subPipe(CollectionType.ARRAY, setResult(array(part1, part2)), ResultCreation.NEW_OBJECT);
    }

    take(cnt?:number):DataPipe<R,T> {
        return this.first(cnt);
    }

    head(cnt?:number):DataPipe<R,T> {
        return this.first(cnt);
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

    keys():DataPipe<R,string> {
        return this.subPipe<string>(CollectionType.ARRAY, isObjectConditional(
            this.type,
            result,
            setResult(call(param(Object.keys), [result])),
            setResult(array())
        ), ResultCreation.NEW_OBJECT);
    }

    allKeys():DataPipe<R,string> {
        return this.toIterable().mapLike<string>(assign(current, index), true);
    }

    values():DataPipe<R,T> {
        return this.toIterable().map<T>();
    }

    mapObject<O>(iteratee?:Iteratee<T,O>, context?:any):DataPipe<R,O> {
        return this.mapObjectLike<O>(assign(current, access(toAccessible(iteratee), context)));
    }

    pairs():DataPipe<R,{0:string,1:T}> {
        return this.toIterable().mapLike<any>(assign(current, array(index, current))); //todo assignCurrent method
    }

    invert():DataPipe<R,string> {
        return this.mapObjectLike<string>(empty, assign(prop(result, current), index));
    }

    create(props):DataPipe<R,T> {
        var propAssignments:CodeText<void>[] = [];
        if (props) {
            for (var i in props) {
                if (hasOwnProperty.call(props, i)) {
                    propAssignments.push(assign(prop(result, i), param(props[i])));
                }
            }
        }

        return this.subPipe<T>(CollectionType.MAP, seq([
            isObjectConditional(
                this.type,
                result,
                setResult(callParam(Object.create, null, [result])),
                setResult(obj())
            ),
            seq(propAssignments)
        ]), ResultCreation.NEW_OBJECT);
    }

    functions():DataPipe<R,string> { //todo find similar
        return this.toIterable()
            .subPipe<T>(CollectionType.MAP, {
                rename: true,
                before: filterMapObjectBefore,
                after: filterMapObjectAfter,
                text: conditional(
                    neq(type(current), literal('function')),
                    cont
                ),
                mergeStart: true,
                mergeEnd: true,
                includeParent: true
            }, ResultCreation.NEW_OBJECT)
            .mapLike<string>(assign(current, index), true);
    }

    findKey(predicate?:Predicate<T>, context?:any):DataPipeResult<R,string> {
        return this.toIterable().indexOfLike<string>({
            item: predicate,
            isPredicate: true,
            context: context,
            defaultValue: undef
        });
    }

    extend(...sources:any[]):DataPipe<R,T> {
        return this.extendLike(sources, true);
    }

    extendOwn(...sources:any[]):DataPipe<R,T> {
        return this.extendLike(sources, false);
    }

    pick(predicate:(prop?:string)=>boolean, context?:any):DataPipe<R,T>
    pick(...properties:string[]):DataPipe<R,T>
    pick(predicate:string|((prop?:string)=>boolean), context?:any):DataPipe<R,T> {
        return this.pickLike(arguments, false);
    }

    omit(predicate:(prop?:string)=>boolean, context?:any):DataPipe<R,T>
    omit(...properties:string[]):DataPipe<R,T>
    omit(predicate:string|((prop?:string)=>boolean), context?:any):DataPipe<R,T> {
        return this.pickLike(arguments, true);
    }

    defaults(...defaults:any[]):DataPipe<R,T> {
        return this.extendLike(defaults, true, true);
    }

    clone():DataPipe<R,T> {
        if (this.hasNewResult()) {
            return this;
        }
        switch (this.type) {
            case CollectionType.ARRAY:
                return this.toArray();
            case CollectionType.MAP:
                return this.mapObject<T>();
            case CollectionType.UNKNOWN:
                return this.subPipe<T>(CollectionType.UNKNOWN, {
                    createCode: (ctx:Context)=> {
                        return {
                            rename: true,
                            before: ctx.array ? itarMapBefore : filterMapObjectBefore,
                            after: ctx.array ? itarMapAfter : filterMapObjectAfter,
                            text: empty,
                            mergeStart: true,
                            mergeEnd: true,
                            includeParent: true
                        };
                    },
                    primitiveCode: empty,
                    handlesSize: false
                }, ResultCreation.NEW_OBJECT);
        }
    }

    tap(interceptor:(t?:T)=>any):DataPipe<R,T> {
        var code = statement(callParam(interceptor, null, [result]));
        return this.subPipe<T>(this.type, code, ResultCreation.USES_PREVIOUS);
    }

    has(property:string):DataPipeResult<R,boolean> {
        var value = and(neql(result, nullValue), call(param(hasOwnProperty), [param(property)], result));
        return this.subPipe(CollectionType.UNKNOWN, setResult(value), ResultCreation.NEW_OBJECT) as any;
    }

    matcher():DataPipeResult<R,(o:any)=>boolean> {
        var code = setResult(callParam(matcher, null, [result]));
        return this.subPipe(CollectionType.UNKNOWN, code, ResultCreation.NEW_OBJECT) as any;
    }

    abstract process(data:R[]):T[];

    abstract getSteps():Step[];

    abstract compile():DataPipe<R,T>;

    abstract fn():Mapper<R, T>;

    abstract hasNewResult():boolean;

    private toIterable():DataPipe<R,T> {
        if (this.type === CollectionType.UNKNOWN) {
            return this.subPipe<T>(CollectionType.MAP, isObjectConditional(
                this.type,
                result,
                empty,
                setResult(obj())
            ), ResultCreation.USES_PREVIOUS);
        }
        return this;
    }

    private filterLike(predicate:CodeText<boolean>|Predicate<T>, context:any, inverted?:boolean, textBefore?:CodeText<any>, elseCode?:CodeText<any>):DataPipe<R,T> { //todo rearrange for safety
        var condition:CodeText<boolean>;
        if (isArray(predicate)) {
            condition = predicate as CodeText<boolean>;
        } else {
            condition = access(toAccessible<T, boolean>(predicate), context);
        }
        if (!inverted) {
            condition = not(condition);
        }
        return this.subPipe<T>(CollectionType.ARRAY, {
            createCode: (ctx:Context, needs:Needs)=> {
                var before:CodeText<any>;
                var after:CodeText<any>;

                if (needs.size) {
                    before = setResult(literal(0));
                    after = increment(result);
                } else {
                    before = filterMapBefore;
                    after = filterMapAfter;
                }

                return {
                    rename: true,
                    changesIndex: true,
                    before: before,
                    after: after,
                    text: seq([
                        textBefore || empty,
                        conditional(
                            condition,
                            cont,
                            elseCode
                        )
                    ]),
                    mergeStart: true,
                    mergeEnd: true
                };
            },
            handlesSize: true
        }, ResultCreation.NEW_OBJECT);
    }

    private edge(initial:CodeText<number>, operator:Operator<number,boolean>,
                 iteratee?:Iteratee<T,number>, context?:any):DataPipeResult<R,any> {
        var initialize = setResult(initial);
        if (!iteratee) {
            return this.reduceLike(CollectionType.UNKNOWN, initialize, conditional(
                operator(current, result),
                setResult(current)
            ), false) as any;
        }

        var edge = named<number>('edgeValue');
        var value = named<number>('value');
        var text = seq([
            declare(value, access(toAccessible(iteratee), context)),
            conditional(
                operator(value, edge),
                seq([
                    assign(edge, value),
                    setResult(current)
                ])
            )
        ]);
        return this.reduceLike(CollectionType.UNKNOWN, seq([initialize, declare(edge, initial)]), text, false) as any;
    }

    private everyLike(predicate:Predicate<T>, context:any, inverted?:boolean):DataPipeResult<R, boolean> {
        var condition = access(toAccessible(predicate), context); //todo access(toAccessible common

        if (!inverted) {
            condition = not(condition);
        }

        var initial = inverted ? falseValue : trueValue;
        var noMatch = inverted ? trueValue : falseValue;
        return this.subPipe(CollectionType.UNKNOWN, { //todo throw error when creating subpipe from a guaranteed primitive
            rename: true,
            before: setResult(initial),
            after: empty,
            text: conditional(
                condition,
                seq([
                    setResult(noMatch),
                    br
                ])
            ),
            mergeStart: true,
            mergeEnd: false
        }, ResultCreation.NEW_OBJECT) as DataPipeResult<R, any>;
    }

    private mapLike<O>(text:CodeText<any>, includeParent?:boolean):DataPipe<R,O> {
        return this.subPipe<O>(CollectionType.ARRAY, {
            createCode: (ctx:Context, needs:Needs)=> {
                if (needs.size) {
                    return empty;
                }

                var loop:Loop = {
                    rename: true,
                    before: filterMapBefore,
                    after: filterMapAfter,
                    text: text,
                    mergeStart: true,
                    mergeEnd: true,
                    includeParent: includeParent
                };

                optimizeMap(loop, ctx);

                return loop;
            },
            handlesSize: true
        }, ResultCreation.NEW_OBJECT, NEEDS_SAME);
    }

    private mapObjectLike<O>(text:CodeText<any>, after?:CodeText<any>):DataPipe<R,O> {
        return this.toIterable().subPipe<O>(CollectionType.MAP, {
            rename: true,
            before: filterMapObjectBefore,
            after: after || filterMapObjectAfter,
            text: text,
            mergeStart: true,
            mergeEnd: true
        }, ResultCreation.NEW_OBJECT);
    }


    private reduceLikeWithProvider<M>(reducer:(memo?:M, t?:T) => M, memo:Provider<M>, context:any, reversed:boolean) {
        var initial:CodeText<M|Provider<M>> = param(memo);
        if (!isPrimitive(memo)) {
            if (typeof memo !== 'function') {
                throw new Error('The memo should be primitive, or a provider function.');
            } else {
                initial = call(initial as CodeText<()=>M>);
            }
        }
        var text:CodeText<void> = setResult(callParam(reducer, context, [result, current, index]));
        return this.reduceLike(CollectionType.UNKNOWN, setResult(initial), text, reversed);
    }

    private reduceLike<X>(type:CollectionType, initialize:CodeText<any>, text:CodeText<any>, reversed:boolean):DataPipe<R,X> {
        return this.subPipe<X>(type, {
            rename: true,
            before: initialize,
            after: empty,
            text: text,
            mergeStart: !reversed,
            mergeEnd: false,
            reversed: reversed
        }, ResultCreation.NEW_OBJECT);
    }

    private indexOfLike<O extends number|string>(params:IndexOfLikeParams):DataPipeResult<R,O> {
        var condition:CodeText<boolean>;
        if (params.isPredicate) {
            condition = access(toAccessible(params.item), params.context)
        } else {
            condition = eq(current, param(params.item));
        }
        return this.reduceLike(CollectionType.UNKNOWN, setResult(params.defaultValue || literal(-1)), conditional(
            condition,
            seq([
                setResult(index),
                br
            ])
        ), params.reversed) as any;
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
        return this.subPipe(CollectionType.UNKNOWN, code, ResultCreation.NEW_OBJECT) as any;
    }

    private extendLike(sources:any[], includeParent:boolean, undefinedOnly?:boolean) {
        var merged = {};
        for (let i = 0; i < sources.length; i++) {
            var source:Object = sources[i];
            let type = typeof source;
            if (type === 'object' || type === 'function') {
                for (let key in source) {
                    if (hasOwnProperty.call(source, key) || includeParent) {
                        if (!undefinedOnly || merged[key] === void 0) {
                            merged[key] = source[key];
                        }
                    }
                }
            }
        }
        var statements:CodeText<void>[] = [];
        for (let key in merged) {
            /* istanbul ignore else  */
            if (hasOwnProperty.call(merged, key)) {
                var assignment = assign(prop(result, key), param(merged[key]));
                var statement:CodeText<void>;
                if (undefinedOnly) {
                    statement = conditional(eq(prop(result, key), undef), assignment);
                } else {
                    statement = assignment;
                }
                statements.push(statement);
            }
        }
        return this.subPipe<T>(CollectionType.MAP, conditional(
            neql(result, nullValue),
            seq(statements)
        ), ResultCreation.USES_PREVIOUS);
    }

    private pickLike(args:IArguments, invert:boolean):DataPipe<R,T> {
        var dataOld = named<{[index:string]:any}>('dataOld'); //todo make it common

        var statements:CodeText<void>[] = [];

        var predicate:(...args)=>boolean = args[0];
        var context = args[1];
        if (typeof predicate === 'function') {
            var callPredicate = callParam(predicate, context);
            if (!invert) {
                callPredicate = not(callPredicate);
            }
            statements.push(itin( //todo create filterMap step which can be merged
                dataOld,
                seq([
                    declare(current, prop(dataOld, index)),
                    conditional(
                        callPredicate,
                        cont,
                        filterMapObjectAfter
                    )
                ])
            ));
        } else {
            let properties:string[] = [];
            flattenTo(args, properties);

            if (invert && properties.length > 0) {
                let indexInProperties:CodeText<boolean>;
                for (var i = 0; i < properties.length; i++) {
                    var condition = eq(index, literal(properties[i] + ''));
                    if (indexInProperties) {
                        indexInProperties = or(indexInProperties, condition);
                    } else {
                        indexInProperties = condition;
                    }
                }

                statements.push(itin(
                    dataOld,
                    seq([
                        conditional(
                            indexInProperties,
                            cont,
                            assign(prop(result, index), current)
                        )
                    ])
                ));
            } else {
                for (var i = 0; i < properties.length; i++) {
                    var property = properties[i] + '';
                    statements.push(assign(prop(result, property), prop(dataOld, property)));
                }
            }
        }

        return this.subPipe<T>(CollectionType.MAP, seq([
            declare(dataOld, result),
            assign(result, obj()),
            conditional(
                neql(dataOld, nullValue),
                seq(statements)
            )
        ]), ResultCreation.NEW_OBJECT);
    }

    private subPipe<X>(type:CollectionType, code:DynamicCode, resultCreation:ResultCreation, np?:NeedsProvider):DataPipe<R,X> {
        return new DataPipe.ChildDataPipe<R,X>(type, this, code, resultCreation, np);
    }
}
export = DataPipe;

function isPrimitive(value:any) {
    return value === null || (typeof value !== 'function' && typeof value !== 'object');
}

function whereFilter(properties:Properties):IterateeFunction<any,boolean> {
    var statements:CodeText<void|Ret<boolean>>[] = [];
    if (typeof properties !== 'string') {
        for (let i in properties) {
            if (hasOwnProperty.call(properties, i)) {
                var condition = neq(
                    prop(current, i),
                    param(properties[i])
                );
                if (properties[i] === void 0) {
                    condition = or(condition, not(par(isIn(literal(i), current))))
                }
                statements.push(conditional(
                    condition,
                    ret(falseValue)
                ));
            }
        }
    }
    if (statements.length > 0) {
        statements.unshift(conditional(
            eql(current, literal(null)),
            ret(falseValue)
        ));
    }
    statements.push(ret(trueValue));

    var params = [];
    var fn:string = codeTextToString(ret(func(['x'], retSeq(statements))), params);
    return (new Function(getParamNames(params), fn)).apply(null, params);
}

function matcher(attrs:Object):(object?:any)=>boolean {
    var copy = {};
    for (var key in attrs) {
        if (hasOwnProperty.call(attrs, key)) {
            copy[key] = attrs[key];
        }
    }
    attrs = copy;
    return function (object?:any):boolean {
        object = Object(object);
        for (var key in attrs) {
            /* istanbul ignore else */
            if (hasOwnProperty.call(attrs, key)) {
                if (attrs[key] !== object[key] || !(key in object)) {
                    return false;
                }
            }
        }
        return true;
    };
}

function optimizeMap(loop:Loop, ctx:Context):void { //todo auto
    if (!ctx.loop || (!ctx.loop.lengthDirty && ctx.array)) {
        loop.before = itarMapBefore;
        loop.after = itarMapAfter;
    }
}

function flattenTo(array, result) {
    var length = array.length;
    for (var i = 0; i < length; ++i) {
        var obj = array[i];
        if (obj && isArray(obj)) {
            flattenTo(obj, result);
        } else {
            result.push(obj);
        }
    }
    return result;
}

function toAccessible<T,R>(iteratee?:Iteratee<T,R>):Accessible<T,R> {
    if (typeof iteratee === 'string' || typeof iteratee === 'number' || iteratee == null || typeof  iteratee === 'function') {
        return iteratee as any;
    } else {
        return whereFilter(iteratee as Properties);
    }
}

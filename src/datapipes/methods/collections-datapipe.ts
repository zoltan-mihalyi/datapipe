import {
    statement,
    callParam,
    assign,
    current,
    access,
    setResult,
    undef,
    empty,
    conditional,
    seq,
    br,
    named,
    declare,
    array,
    params,
    prop,
    ternary,
    nullValue,
    eql,
    param,
    negativeInfinity,
    gt,
    lt,
    infinity,
    result,
    func,
    subtract,
    ret,
    obj,
    cast,
    increment,
    literal,
    multiply,
    par,
    add,
    index,
    call,
    neq,
    toInt,
    not,
    cont,
    falseValue,
    trueValue,
    Operator
} from "../../code-helpers";
import {CollectionType} from "../../common";
import {
    ResultCreation,
    toAccessible,
    Provider,
    DataPipeResult,
    whereFilter,
    filterMapBefore,
    optimizeMap,
    NEEDS_SAME,
    filterMapAfter,
    isArray,
    Step
} from "../datapipe-common";
import DataPipe = require("../datapipe");
import ChildDataPipe = require("../child-datapipe");

function isPrimitive(value:any) {
    return value === null || (typeof value !== 'function' && typeof value !== 'object');
}

abstract class CollectionsDataPipe<R,T> implements DataPipeResult<R,T[]> {
    constructor(public type:CollectionType) {
    }

    each(callback:(t?:T)=>any, context?:any):DataPipe<R,T> {
        return this.subPipe<T>(this.type, {
            text: statement(callParam(callback, context)),
            mergeStart: true,
            mergeEnd: true,
            changesLength: false
        }, ResultCreation.USES_PREVIOUS);
    }

    map<O>(iteratee?:Iteratee<T,O>, context?:any):DataPipe<R,O> { //todo is there a correlation between fields?
        return this.mapLike<O>(assign(current, access(toAccessible(iteratee), context)));
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
        return this.resultPipe<T>({
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
        }, false);
    }

    filter(predicate?:Predicate<T>, context?:any):DataPipe<R,T> { //todo filter with properties and regexp
        return this.filterLike(predicate, context);
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

    max(iteratee:Iteratee<T,number>):DataPipeResult<R, T>;
    max():DataPipeResult<R, number>;
    max(iteratee?:Iteratee<T,number>, context?:any) {
        return this.edge(negativeInfinity, gt, iteratee, context);
    }

    min(iteratee:Iteratee<T,number>):DataPipeResult<R, T>;
    min():DataPipeResult<R, number>;
    min(iteratee?:Iteratee<T,number>, context?:any) {
        return this.edge(infinity, lt, iteratee, context);
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
    sample(count?:number):any { //todo code contains toArray code in array part?
        if (count == null) {
            var math:CodeText<{[index:string]:()=>number}> = named<any>('Math');
            var code = setResult(prop(result, toInt(multiply(call(prop(math, 'random')), prop<number>(result, 'length')))));
            return this.toArray().resultPipe<T>(code, false);
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

    partition(predicate?:Predicate<T>, context?:any):DataPipe<R,{0:T,1:T}> { //todo predicate type with index and list
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
        }, ResultCreation.USES_PREVIOUS).subPipe<{0:T,1:T}>(CollectionType.ARRAY, setResult(array(part1, part2)), ResultCreation.NEW_OBJECT);
    }

    abstract process(data:R[]):T[];

    abstract getSteps():Step[];

    abstract compile():DataPipe<R,T>;

    abstract fn():Mapper<R, T>;

    abstract hasNewResult():boolean;

    abstract asDataPipe():DataPipe<R,T>;

    abstract newChild<R,T>(type:CollectionType, parent:CollectionsDataPipe<R,any>, code:DynamicCode, resultCreation:ResultCreation, np?:NeedsProvider):ChildDataPipe<R,T>;

    protected subPipe<X>(type:CollectionType, code:DynamicCode, resultCreation:ResultCreation, np?:NeedsProvider):ChildDataPipe<R,X> {
        return this.newChild<R,X>(type, this, code, resultCreation, np);
    }

    protected resultPipe<X>(code:DynamicCode, newResult:boolean):DataPipeResult<R,X> {
        var resultCreation = newResult ? ResultCreation.NEW_OBJECT : ResultCreation.EXISTING_OBJECT;
        return this.subPipe(CollectionType.UNKNOWN, code, resultCreation) as any;
    }

    protected mapLike<O>(text:CodeText<any>, includeParent?:boolean):DataPipe<R,O> {
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


    protected reduceLike<X>(type:CollectionType, initialize:CodeText<any>, text:CodeText<any>, reversed:boolean):DataPipe<R,X> {
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

    protected filterLike(predicate:CodeText<boolean>|Predicate<T>, context:any, inverted?:boolean, textBefore?:CodeText<any>, elseCode?:CodeText<any>):DataPipe<R,T> { //todo rearrange for safety
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

    private everyLike(predicate:Predicate<T>, context:any, inverted?:boolean):DataPipeResult<R, boolean> {
        var condition = access(toAccessible(predicate), context); //todo access(toAccessible common

        if (!inverted) {
            condition = not(condition);
        }

        var initial = inverted ? falseValue : trueValue;
        var noMatch = inverted ? trueValue : falseValue;
        return this.resultPipe<boolean>({ //todo throw error when creating subpipe from a guaranteed primitive
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
        }, true);
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
}
export = CollectionsDataPipe;
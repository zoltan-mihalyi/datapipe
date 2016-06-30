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
    paramName,
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
    itarMapAfter
} from "./code-helpers";
import {CollectionType, isProvider} from "./common";

const filterMapBefore = setResult(array());
const filterMapAfter = call(prop<()=>any>(result, 'push'), [current]);

const NEEDS_ALL:NeedsProvider = () => {
    return {};
};

const NEEDS_SAME:NeedsProvider = (needs:Needs)=> {
    return needs;
};

const enum ResultCreation {
    NEW_OBJECT, USES_PREVIOUS, EXISTING_OBJECT
}

const SIZE_CODE_PROVIDER:CodeProvider = {
    createCode: (ctx:Context)=> {
        if (ctx.array) {
            return setResult(prop<number>(result, 'length'));
        } else {
            return {
                before: setResult(literal(0)),
                after: increment(result),
                text: empty,
                mergeStart: true,
                mergeEnd: false,
                rename: true
            };
        }
    },
    handlesSize: true
};

interface DataPipeResult<R,T> {
    process(data:R[]):T;
    compile():DataPipeResult<R,T>;
}

interface Step {
    code:DynamicCode;
    parentType:CollectionType;
    needsProvider:NeedsProvider;
}

type Primitive = string|number|boolean|void;

type Provider<T> = {():T}|Primitive&T;

type Mapper<I,O> = (data:I[])=>O[];

abstract class DataPipe<R,P,T> implements DataPipeResult<R,T[]> {
    constructor(public type:CollectionType) {
    }

    map<O>(fn:(t?:T)=>O, context?:any):ChildDataPipe<R,T,O> { //todo is there a correlation between fields?
        return this.mapLike<O>(assign(current, callParam(fn, context)));
    }

    filter(predicate:(t?:T) => boolean, context?:any):ChildDataPipe<R,T,T> { //todo filter with properties and regexp
        return this.filterLike(predicate, context);
    }

    each(callback:(t?:T)=>any, context?:any):ChildDataPipe<R,T,T> {
        return this.subPipe<T>(this.type, {
            text: statement(callParam(callback, context)),
            mergeStart: true,
            mergeEnd: true,
            changesLength: false
        }, ResultCreation.USES_PREVIOUS);
    }

    reduce<M>(reducer:(memo:M[], t:T)=>M[], memo:Provider<M[]>):ChildDataPipe<R,T,M>;
    reduce<M>(reducer:(memo:M, t:T)=>M, memo:Provider<M>):DataPipeResult<R,M>;
    reduce<M>(reducer:(memo:M, t:T)=>M, memo:Provider<M>, context?:any) {
        return this.reduceLikeWithProvider<M>(reducer, memo, context, false);
    }

    reduceRight<M>(reducer:(memo:M[], t:T)=>M[], memo:Provider<M[]>):ChildDataPipe<R,T,M>;
    reduceRight<M>(reducer:(memo:M, t:T)=>M, memo:Provider<M>):DataPipeResult<R,M>;
    reduceRight<M>(reducer:(memo:M, t:T)=>M, memo:Provider<M>, context?:any) {
        return this.reduceLikeWithProvider<M>(reducer, memo, context, true);
    }

    find(predicate:(t?:T) => boolean, context?:any):DataPipeResult<R,T> {
        return this.subPipe(CollectionType.UNKNOWN, {
            rename: true,
            before: setResult(undef),
            after: empty,
            text: conditional(
                callParam(predicate, context),
                seq([
                    setResult(current),
                    br
                ])
            ),
            mergeStart: true,
            mergeEnd: false
        }, ResultCreation.EXISTING_OBJECT) as any;
    }

    take(cnt?:number):ChildDataPipe<R,T,T> {
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

    last(cnt?:number):ChildDataPipe<R,T,T> { //todo very similar to take
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

    rest(cnt?:number):ChildDataPipe<R,T,T> { //todo tail, drop
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

    initial(cnt?:number):ChildDataPipe<R,T,T> {
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

    compact():ChildDataPipe<R,T,T> {
        return this.filterLike(current, null, false);
    }

    where(properties):ChildDataPipe<R,T,T> {
        return this.filter(whereFilter(properties));
    }

    findWhere(properties):DataPipeResult<R,any> {
        return this.find(whereFilter(properties));
    }

    reject(predicate:(t:T) => boolean, context?:any):ChildDataPipe<R,T,T> {
        return this.filterLike(predicate, context, true);
    }

    every(predicate:(t:T) => boolean, context?:any):DataPipeResult<R, boolean> {
        return this.everyLike(predicate, context);
    }

    some(predicate:(t:T) => boolean, context?:any):DataPipeResult<R, boolean> {
        return this.everyLike(predicate, context, true);
    }

    contains(value:T):DataPipeResult<R, boolean> {
        return this.some(x => x === value); //todo fromIndex parameter, use indexOf if not merged
    }

    flatten(shallow?:boolean):ChildDataPipe<R,T,any> {
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

    invoke(method:string, ...methodArgs:any[]):ChildDataPipe<R,T,any>;
    invoke<O>(method:(...args:any[]) => O, ...methodArgs:any[]):ChildDataPipe<R,T,O>;
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

    pluck(property:string|number):ChildDataPipe<R,T,any> {
        return this.mapLike<any>(assign(current,
            ternary<any>(
                eql(current, nullValue),
                undef,
                prop(current, property)
            )
        ));
    }

    min(fn:string|((x:T) => number)):DataPipeResult<R, T>;
    min():DataPipeResult<R, number>;
    min(iteratee?:string|((x?:T) => number), context?:any) {
        return this.edge(infinity, lt, iteratee, context);
    }

    max(fn:string|((x:T) => number)):DataPipeResult<R, T>;
    max():DataPipeResult<R, number>;
    max(iteratee?:string|((x?:T) => number), context?:any) {
        return this.edge(negativeInfinity, gt, iteratee, context);
    }

    groupBy(fn:string|((x?:T)=>string|number), context?:any):ChildDataPipe<R,T,T[]> {
        var group = named<string>('group');
        var text:CodeText<any> = seq([
            declare(group, access(fn, context)),
            ternary<any>(
                prop<boolean>(result, group),
                call(prop(prop<any[]>(result, group), 'push'), [current]),
                assign(prop(result, group), array(current))
            )
        ]);

        return this.reduceLike<T[]>(CollectionType.MAP, setResult(obj()), text, false);
    }

    indexBy(fn:string|((x?:T)=>string|number), context?:any):ChildDataPipe<R,T,T> {
        var assignment = assign(prop(result, access(fn, context)), current);
        return this.reduceLike<T>(CollectionType.MAP, setResult(obj()), assignment, false); //todo dont care order?
    }

    sortBy(fn:string|((x?:T)=>number), context?:any):ChildDataPipe<R,T,T> {
        //todo advanced logic, when used after map-like processors
        var text:CodeText<any>;
        if (!this.hasNewResult() || this.type !== CollectionType.ARRAY) {
            return this.toArray().sortBy(fn, context);
        }
        if (!fn) {
            text = statement(call(prop<()=>any>(result, 'sort')), true);
        } else {
            text = statement(call(prop<()=>any>(result, 'sort'), [func(['a', 'b'],
                ret(subtract(
                    access(fn, context, named('a')),
                    access(fn, context, named('b'))
                ))
            )]), true); //todo cache values??
        }
        return this.subPipe<T>(CollectionType.ARRAY, text, ResultCreation.NEW_OBJECT);
    }

    countBy(property?:string|((x?:T)=>any), context?:any):ChildDataPipe<R,T,number> {
        var group:CodeText<any>;
        var firstStatement = empty;
        if (!property) {
            group = current;
        } else {
            group = named('group');
            firstStatement = declare(group, access(property, context));
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

    shuffle():ChildDataPipe<R,T,T> {
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

    toArray():ChildDataPipe<R,T,T> {
        return this.mapLike<T>(empty); //todo optimize here, not in the accumulator
    }

    size():ChildDataPipe<R,T,T> {
        return this.subPipe<T>(CollectionType.UNKNOWN, empty, ResultCreation.NEW_OBJECT, ()=> {
            return {
                size: true
            };
        });
    }

    partition(predicate:(t?:T) => boolean, context?:any) { //todo predicate type with index and list
        var part1 = named('part1');
        var part2 = named('part2');
        return this.subPipe(CollectionType.UNKNOWN, {
            before: seq([
                declare(part1, array()),
                declare(part2, array())
            ]),
            text: statement(ternary(
                callParam(predicate, context),
                call(prop<any>(part1, 'push'), [current]),
                call(prop<any>(part2, 'push'), [current])
            )),
            mergeStart: true,
            mergeEnd: false
        }, ResultCreation.USES_PREVIOUS).subPipe(CollectionType.ARRAY, setResult(array(part1, part2)), ResultCreation.NEW_OBJECT);
    }

    first(cnt?:number):ChildDataPipe<R,T,T> {
        return this.take(cnt);
    }

    head(cnt?:number):ChildDataPipe<R,T,T> {
        return this.take(cnt);
    }

    abstract process(data:R[]):T[];

    abstract getSteps():Step[];

    abstract compile():DataPipe<R,P,T>;

    abstract fn():Mapper<R, T>;

    abstract hasNewResult():boolean;

    private filterLike(predicate:CodeText<boolean>|((t?:T) => boolean), context:any, inverted?:boolean):ChildDataPipe<R,T,T> {
        var condition:CodeText<boolean>;
        if (typeof predicate === 'function') {
            condition = callParam(predicate as (t?:T)=>boolean, context);
        } else {
            condition = predicate as CodeText<boolean>;
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
                    text: conditional(
                        condition,
                        cont
                    ),
                    mergeStart: true,
                    mergeEnd: true
                };
            },
            handlesSize: true
        }, ResultCreation.NEW_OBJECT);
    }

    private edge(initial:CodeText<number>, operator:Operator<number,boolean>,
                 fn?:string|((x?:T)=>number), context?:any):DataPipeResult<R,any> {
        var initialize = setResult(initial);
        if (!fn) {
            return this.reduceLike(CollectionType.UNKNOWN, initialize, conditional(
                operator(current, result),
                setResult(current)
            ), false) as any;
        }

        var edge = named<number>('edgeValue');
        var value = named<number>('value');
        var text = seq([
            declare(value, access(fn, context)),
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

    private everyLike(predicate:(t?:T)=>boolean, context:any, inverted?:boolean):DataPipeResult<R, boolean> {
        var condition = callParam(predicate, context);

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

    private mapLike<O>(text:CodeText<any>):ChildDataPipe<R,T,O> {
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
                    mergeEnd: true
                };

                optimizeMap(loop, ctx);

                return loop;
            },
            handlesSize: true
        }, ResultCreation.NEW_OBJECT, NEEDS_SAME);
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

    private reduceLike<X>(type:CollectionType, initialize:CodeText<any>, text:CodeText<any>, reversed:boolean):ChildDataPipe<R,T,X> {
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

    private subPipe<X>(type:CollectionType, code:DynamicCode, resultCreation:ResultCreation, np?:NeedsProvider):ChildDataPipe<R,T,X> {
        return new ChildDataPipe<R,T,X>(type, this, code, resultCreation, np);
    }
}

class ChildDataPipe<R,P,T> extends DataPipe<R,P,T> { //todo no need parent type?
    private processor:Mapper<R,T> = null;
    private newResult:boolean;
    private needsProvider:NeedsProvider;

    constructor(type:CollectionType, private parent:DataPipe<R,any,P>, private code:DynamicCode, resultCreation:ResultCreation, np?:NeedsProvider) {
        super(type);
        switch (resultCreation) {
            case ResultCreation.NEW_OBJECT:
                this.newResult = true;
                break;
            case ResultCreation.USES_PREVIOUS:
                this.newResult = this.parent.hasNewResult();
                break;
            case ResultCreation.EXISTING_OBJECT:
                this.newResult = false;
                break;
        }

        this.needsProvider = np || NEEDS_ALL;
    }

    process(data:R[]):T[] {
        this.compile();
        return this.processor(data);
    }

    compile():ChildDataPipe<R,P,T> {
        if (this.processor === null) {
            this.processor = this.createProcessor();
        }
        return this;
    }

    fn():Mapper<R,T> {
        return this.compile().processor;
    }

    getSteps():Step[] {
        var codes = this.parent.getSteps();
        codes.push({
            code: this.code,
            parentType: this.parent.type,
            needsProvider: this.needsProvider
        });
        return codes;
    }

    hasNewResult():boolean {
        return this.newResult;
    }

    private createProcessor():Mapper<R,T> {
        var steps:Step[] = this.getSteps();

        var needs = this.processNeeds(steps);

        var accumulator:Accumulator = new Accumulator();
        for (var i = 0; i < steps.length; i++) {
            let step:Step = steps[i];
            if (needs.lengthTransformations[i]) {
                accumulator.put(steps[i].parentType, SIZE_CODE_PROVIDER, {});
            }

            accumulator.put(step.parentType, step.code, needs.byIndex[i]);
        }
        var codeStr:string = accumulator.toCode();
        var params:any[] = accumulator.getParams();

        var fnBody = `return function(data){\n${codeStr}\nreturn data;\n}`;
        var paramNames = [];
        for (let i = 0; i < params.length; i++) {
            paramNames.push(paramName(i));
        }
        return (new Function(paramNames.join(','), fnBody)).apply(null, params);
    }

    private processNeeds(steps:Step[]) {
        var needs:Needs = {};
        var needsByIndex:Needs[] = [];

        var lengthTransformations = {};

        for (var i = steps.length - 1; i >= 0; --i) {
            let step = steps[i];

            needsByIndex[i] = needs;
            needs = step.needsProvider(needs);

            if (needs.size && (i === 0 || !handlesSize(steps[i - 1]))) {
                lengthTransformations[i] = true;
            }
        }

        function handlesSize(step:Step):boolean {
            var code:DynamicCode = step.code;
            return isProvider(code) && code.handlesSize;
        }

        return {
            byIndex: needsByIndex,
            lengthTransformations: lengthTransformations
        };
    }
}

class RootDataPipe<T> extends DataPipe<T,T,T> {
    process(data:T[]):T[] {
        return data;
    }

    compile():RootDataPipe<T> {
        return this;
    }

    fn():Mapper<T,T> {
        return this.process;
    }

    getSteps():Step[] {
        return [];
    }

    hasNewResult():boolean {
        return false;
    }
}

function isPrimitive(value:any) {
    return value === null || (typeof value !== 'function' && typeof value !== 'object');
}

function whereFilter<T extends {[index:string]:any}>(properties:T) {

    var statements:CodeText<void|Ret<boolean>>[] = [];
    for (let i in properties) {
        if (properties.hasOwnProperty(i)) {
            statements.push(conditional(
                neq(
                    prop(current, i),
                    prop(named<T>('properties'), i)
                ),
                ret(falseValue)
            ));
        }
    }
    statements.push(ret(trueValue));

    var fn:string = codeTextToString(ret(func(['x'], retSeq(statements))), null); //todo inline
    return (new Function('properties', fn))(properties);
}

function optimizeMap(loop:Loop, ctx:Context):void { //todo auto
    if (!ctx.loop || (!ctx.loop.lengthDirty && ctx.array)) {
        loop.before = itarMapBefore;
        loop.after = itarMapAfter;
    }
}

var isArray = Array.isArray;
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

export = <T>(typeName?:string) => {
    var type:CollectionType;
    if (typeName === 'array') {
        type = CollectionType.ARRAY;
    } else if (typeName === 'object' || typeName === 'map') {
        type = CollectionType.MAP;
    } else {
        type = CollectionType.UNKNOWN;
    }
    return new RootDataPipe<any>(type);
};
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
    par
} from "./code-helpers";
import {CollectionType, filterMapBefore, filterMapAfter} from "./common";

interface DataPipeResult<R,T> {
    process(data:R[]):T;
    compile():DataPipeResult<R,T>;
}

interface Step {
    code:Code;
    parentType:CollectionType;
}

type Primitive = string|number|boolean|void;

type Provider<T> = {():T}|Primitive&T;

type Mapper<I,O> = (data:I[])=>O[];

var push = Array.prototype.push;

abstract class DataPipe<R,P,T> implements DataPipeResult<R,T[]> {
    constructor(public type:CollectionType) {
    }

    map<O>(fn:(t?:T)=>O, context?:any):ChildDataPipe<R,T,O> { //todo is there a correlation between fields?
        return this.mapLike<O>(assign(current, callParam(fn, context)));
    }

    filter(predicate:(t?:T) => boolean, context?:any):ChildDataPipe<R,T,T> {
        return this.filterLike(predicate, context);
    }

    each(callback:(t?:T)=>any, context?:any):ChildDataPipe<R,T,T> {
        return this.subPipe<T>(this.type, {
            text: statement(callParam(callback, context)),
            mergeStart: true,
            mergeEnd: true
        }, false);
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
        }, true) as any;
    }

    take(cnt?:number):ChildDataPipe<R,T,T> {
        //todo slice if array
        if (cnt == null) {
            return this.subPipe<T>(CollectionType.UNKNOWN, {
                rename: true,
                before: setResult(undef),
                after: empty,
                text: seq([
                    setResult(current),
                    br
                ]),
                mergeStart: true,
                mergeEnd: false
            }, false);
        }

        return this.subPipe<T>(CollectionType.ARRAY, {
            rename: true, //todo calculate from codeText?
            before: filterMapBefore,
            after: filterMapAfter,
            text: conditional(
                gte(arrayIndex, param(cnt)),
                br
            ),
            mergeStart: true,
            mergeEnd: true
        }, true);
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
        var reducer:(memo:T[], x) => T[];
        if (shallow) {
            reducer = (memo, x)=> {
                if (x && (x as any).length) {
                    push.apply(memo, x);
                } else {
                    memo.push(x);
                }
                return memo;
            };
        } else {
            reducer = (memo, x) => {
                if (x && (x as any).length) {
                    for (let i = 0; i < x.length; i++) {
                        reducer(memo, x[i]);
                    }
                } else {
                    memo.push(x);
                }
                return memo;
            };
        }
        return this.reduce(reducer, () => []); //todo inline?
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
        var before:CodeText<any>;
        var text:CodeText<any>;
        if (this.type === CollectionType.ARRAY) {
            if (!this.hasNewResult()) {
                before = statement(assign(result, call(prop<()=>any>(result, 'slice'))), true);
            } else {
                before = empty;
            }
        } else {
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
        return this.subPipe<T>(CollectionType.ARRAY, seq([
            before,
            text
        ]), true);
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
            return this.toArray().shuffle();
        }
        var rand:CodeText<number> = named<number>('random');
        var math:CodeText<{[index:string]:()=>number}> = named<any>('Math');
        var random:CodeText<number> = multiply(call(prop(math, 'random')), par(add(index, literal(1))));
        var flooredRandom:CodeText<number> = call(prop(math, 'floor'), [random]);
        return this.subPipe<T>(CollectionType.ARRAY, {
            before: filterMapBefore,
            text: seq([
                declare(rand, flooredRandom),
                conditional(neq(rand, index), assign(prop(result, index), prop(result, rand)))
            ]),
            after: assign(prop(result, rand), current),
            mergeStart: true,
            mergeEnd: false
        }, true);
    }

    toArray():ChildDataPipe<R,T,T> {
        return this.mapLike<T>(empty); //todo optimize here, not in the accumulator
    }

    size():ChildDataPipe<R,T,T> {
        if (this.type !== CollectionType.ARRAY) {
            return this.toArray().size(); //todo only toArray in the map type branch
        }
        return this.subPipe<T>(CollectionType.UNKNOWN, setResult(prop<number>(result, 'length')), true);
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
        }, false).subPipe(CollectionType.ARRAY, setResult(array(part1, part2)), true);
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

    private filterLike(predicate:(t?:T) => boolean, context:any, inverted?:boolean):ChildDataPipe<R,T,T> {
        var condition:CodeText<boolean> = callParam(predicate, context);
        if (!inverted) {
            condition = not(condition);
        }
        return this.subPipe<T>(CollectionType.ARRAY, {
            rename: true,
            changesIndex: true,
            before: filterMapBefore,
            after: filterMapAfter,
            text: conditional(
                condition,
                cont
            ),
            mergeStart: true,
            mergeEnd: true
        }, true);
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
        }, true) as DataPipeResult<R, any>;
    }

    private mapLike<O>(text:CodeText<any>):ChildDataPipe<R,T,O> {
        return this.subPipe<O>(CollectionType.ARRAY, {
            rename: true,
            before: filterMapBefore,
            after: filterMapAfter,
            text: text,
            mergeStart: true,
            mergeEnd: true
        }, true);
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
        }, true);
    }

    private subPipe<X>(type:CollectionType, code:Code, newResult:boolean):ChildDataPipe<R,T,X> {
        return new ChildDataPipe<R,T,X>(type, this, code, newResult);
    }
}

class ChildDataPipe<R,P,T> extends DataPipe<R,P,T> { //todo no need parent type?
    private processor:Mapper<R,T> = null;
    private newResult:boolean;

    constructor(type:CollectionType, private parent:DataPipe<R,any,P>, private code:Code, newResult:boolean) {
        super(type);
        this.newResult = newResult || this.parent.hasNewResult();
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
            parentType: this.parent.type
        });
        return codes;
    }

    hasNewResult():boolean {
        return this.newResult;
    }

    private createProcessor():Mapper<R,T> {
        var steps:Step[] = this.getSteps();

        var params = []; //todo params and codeStr to accumulator
        var codeStr = '';
        var accumulator:Accumulator = new Accumulator();
        for (var i = 0; i < steps.length; i++) {
            let step:Step = steps[i];
            if (!accumulator.canPut(step.code)) {
                codeStr += accumulator.flush(params);
            }
            accumulator.put(step.parentType, step.code);
        }
        codeStr += accumulator.flush(params);

        var fnBody = `return function(data){\n${codeStr}\nreturn data;\n}`;
        var paramNames = [];
        for (let i = 0; i < params.length; i++) {
            paramNames.push(paramName(i));
        }
        return (new Function(paramNames.join(','), fnBody)).apply(null, params);
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
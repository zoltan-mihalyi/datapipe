//todo no context, no index, no list!
//todo asm.js
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
    count,
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
    minus,
    obj,
    access,
    params,
    neq,
    paramName,
    codeTextToString
} from "./code-helpers";

var filterMapBefore = setResult(array());
var filterMapAfter = call(prop(result, 'push'), [current]);

interface DataPipeResult<R,T> {
    process(data:R[]):T;
    compile():DataPipeResult<R,T>;
}

type Primitive = string|number|boolean|void;

type Provider<T> = {():T}|Primitive&T;

type Mapper<I,O> = (data:I[])=>O[];

var push = Array.prototype.push;

abstract class DataPipe<R,P,T> implements DataPipeResult<R,T[]> {
    map<O>(fn:(t:T)=>O):ChildDataPipe<R,T,O> { //todo is there a correlation between fields?
        return this.mapLike<O>(assign(current, call(param(fn), [current])));
    }

    filter(predicate:(t:T) => boolean):ChildDataPipe<R,T,T> {
        return this.subPipe<T>({
            rename: true,
            changesCount: true,
            before: filterMapBefore,
            after: filterMapAfter,
            text: conditional(
                not(call(
                    param(predicate),
                    [current]
                )),
                cont
            ),
            mergeStart: true,
            mergeEnd: true
        });
    }

    each(callback:(t:T)=>any):ChildDataPipe<R,T,T> {
        return this.subPipe<T>({
            text: call(param(callback), [current]),
            mergeStart: true,
            mergeEnd: true
        });
    }

    reduce<M>(reducer:(memo:M[], t:T)=>M[], memo:Provider<M[]>):ChildDataPipe<R,T,M>;
    reduce<M>(reducer:(memo:M, t:T)=>M, memo:Provider<M>):DataPipeResult<R,M>;
    reduce<M>(reducer:(memo:M, t:T)=>M, memo:Provider<M>) {
        return this.reduceLikeWithProvider<M>(reducer, memo, false);
    }

    reduceRight<M>(reducer:(memo:M[], t:T)=>M[], memo:Provider<M[]>):ChildDataPipe<R,T,M>;
    reduceRight<M>(reducer:(memo:M, t:T)=>M, memo:Provider<M>):DataPipeResult<R,M>;
    reduceRight<M>(reducer:(memo:M, t:T)=>M, memo:Provider<M>) {
        return this.reduceLikeWithProvider<M>(reducer, memo, true);
    }

    find(predicate:(t:T) => boolean):DataPipeResult<R,T> {
        return this.subPipe({
            rename: true,
            before: setResult(undef),
            after: empty,
            text: conditional(
                call(param(predicate), [current]),
                seq([
                    setResult(current),
                    br
                ])
            ),
            mergeStart: true,
            mergeEnd: false
        }) as any;
    }

    take(cnt:number):ChildDataPipe<R,T,T> {
        return this.subPipe<T>({
            rename: true, //todo calculate from codeText?
            usesCount: true,
            before: filterMapBefore,
            after: filterMapAfter,
            text: conditional(
                gt(count, param(cnt)),
                br
            ),
            mergeStart: true,
            mergeEnd: true
        });
    }

    where(properties):ChildDataPipe<R,T,T> {
        return this.filter(whereFilter(properties));
    }

    findWhere(properties):DataPipeResult<R,any> {
        return this.find(whereFilter(properties));
    }

    reject(predicate:(t:T) => boolean):ChildDataPipe<R,T,T> {
        return this.filter(t => !predicate(t)); //TODO can be reduced to on function call
    }

    every(predicate:(t:T) => boolean):DataPipeResult<R, boolean> {
        return this.everyLike(predicate);
    }

    some(predicate:(t:T) => boolean):DataPipeResult<R, boolean> {
        return this.everyLike(predicate, true);
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
        return this.reduce(reducer, () => []);
    }

    invoke(method:string, ...methodArgs:any[]):ChildDataPipe<R,T,any>;
    invoke<O>(method:(...args:any[]) => O, ...methodArgs:any[]):ChildDataPipe<R,T,O>;
    invoke(method:string|Function, ...methodArgs:any[]) {
        var newValue:CodeText;
        var methodParams = params(methodArgs);
        if (typeof method === 'string') {
            let access = prop(current, method);
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
            ternary(
                eql(current, nullValue),
                undef,
                prop(current, property)
            )
        ));
    }

    min(fn:string|((x:T) => number)):DataPipeResult<R, T>;
    min():DataPipeResult<R, number>;
    min(iteratee?:string|((x:T) => number)) {
        return this.edge(infinity, lt, iteratee);
    }

    max(fn:string|((x:T) => number)):DataPipeResult<R, T>;
    max():DataPipeResult<R, number>;
    max(iteratee?:string|((x:T) => number)) {
        return this.edge(negativeInfinity, gt, iteratee);
    }

    groupBy(fn:string|((x:T)=>string|number)):ChildDataPipe<R,T,{[index:string]:T[]}> {
        var group = named('group');
        var text:CodeText = seq([
            declare('group', access(fn)),
            ternary(
                prop(result, group),
                call(prop(prop(result, group), 'push'), [current]),
                assign(prop(result, group), array(current))
            )
        ]);

        return this.reduceLike<{[index:string]:T[]}>(setResult(obj()), text, false);
    }

    indexBy(fn:string|((x:T)=>string|number)):ChildDataPipe<R,T,{[index:string]:T}> {
        return this.reduceLike<{[index:string]:T}>(setResult(obj()), assign(prop(result, access(fn)), current), false); //todo dont care order?
    }

    sortBy(fn:string|((x:T)=>number)):ChildDataPipe<R,T,T> {
        //todo advanced logic, when used after map-like processors
        if (!fn) {
            return this.subPipe<T>(call(prop(result, 'sort')));
        } else {
            return this.subPipe<T>(call(prop(result, 'sort'), [func(['a', 'b'],
                ret(minus(
                    access(fn, 'a'),
                    access(fn, 'b')
                ))
            )])); //todo cache values??
        }
    }

    private edge(initial:CodeText, operator:(l:CodeText, r:CodeText)=>CodeText, fn?:string|((x:T)=>number)):DataPipeResult<R,any> {
        var initialize = setResult(initial);
        if (!fn) {
            return this.reduceLike(initialize, conditional(
                operator(current, result),
                setResult(current)
            ), false) as any;
        }

        var edge = named('edgeValue'); //todo named and not named?
        var value = named('value');
        var text = seq([
            declare('value', access(fn)),
            conditional(
                operator(value, edge),
                seq([
                    assign(edge, value),
                    setResult(current)
                ])
            )
        ]);
        return this.reduceLike(seq([initialize, declare('edgeValue', initial)]), text, false) as any;
    }

    private everyLike(predicate:(t:T)=>boolean, inverted?:boolean):DataPipeResult<R, boolean> {
        var condition = call(param(predicate), [current]);

        if (!inverted) {
            condition = not(condition);
        }

        var initial = inverted ? falseValue : trueValue;
        var noMatch = inverted ? trueValue : falseValue;
        return this.subPipe({
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
        }) as DataPipeResult<R, any>;
    }

    private mapLike<O>(text:CodeText):ChildDataPipe<R,T,O> {
        return this.subPipe<O>({
            rename: true,
            before: filterMapBefore,
            after: filterMapAfter,
            text: text,
            mergeStart: true,
            mergeEnd: true
        });
    }

    private reduceLikeWithProvider<M>(reducer:(memo:M, t:T) => M, memo:Provider<M>, reversed:boolean) {
        var initial:CodeText = param(memo);
        if (!isPrimitive(memo)) {
            if (typeof memo !== 'function') {
                throw new Error('The memo should be primitive, or a provider function, otherwise reusing the datapipe should produce unexpected results.');
            } else {
                initial = call(initial);
            }
        }
        return this.reduceLike(setResult(initial), setResult(call(param(reducer), [result, current])), reversed);
    }

    private reduceLike<X>(initialize:CodeText, text:CodeText, reversed:boolean):ChildDataPipe<R,T,X> {
        return this.subPipe<X>({
            rename: true,
            before: initialize,
            after: [],
            text: text,
            mergeStart: !reversed,
            mergeEnd: false,
            reversed: reversed
        })
    }

    abstract process(data:R[]):T[];

    abstract getCodes():Code[];

    abstract compile():DataPipe<R,P,T>;

    abstract fn():Mapper<R,T>;

    private subPipe<X>(code:Code):ChildDataPipe<R,T,X> {
        return new ChildDataPipe<R,T,X>(this, code);
    }
}

class ChildDataPipe<R,P,T> extends DataPipe<R,P,T> {
    private processor:Mapper<R,T> = null;

    constructor(private parent:DataPipe<R,any,P>, private code:Code) {
        super();
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

    private createProcessor():Mapper<R,T> {
        var codes:Code[] = this.getCodes();

        var params = [];
        var codeStr = '';
        var accumulator:Accumulator = new Accumulator();
        for (var i = 0; i < codes.length; i++) {
            var code:Code = codes[i];
            if (!accumulator.canPut(code)) {
                codeStr += accumulator.flush();
            }
            accumulator.put(code, params);
        }
        codeStr += accumulator.flush();

        var fnBody = `return function(data){\n${codeStr}\nreturn data;\n}`;
        var paramNames = [];
        for (let i = 0; i < params.length; i++) {
            paramNames.push(paramName(i));
        }
        return (new Function(paramNames.join(','), fnBody)).apply(null, params);
    }

    getCodes():Code[] {
        var codes = this.parent.getCodes();
        codes.push(this.code);
        return codes;
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

    getCodes():Code[] {
        return [];
    }
}

function isPrimitive(value:any) {
    return value === null || (typeof value !== 'function' && typeof value !== 'object');
}

function whereFilter(properties) {

    var statements:CodeText[] = [];
    for (let i in properties) {
        if (properties.hasOwnProperty(i)) {
            statements.push(conditional(
                neq(
                    prop(current, i),
                    prop(named('properties'), i)
                ),
                ret(falseValue)
            ));
        }
    }
    statements.push(ret(trueValue));

    var fn:string = codeTextToString(ret(func(['x'], seq(statements))), null); //todo inline
    return (new Function('properties', fn))(properties);
}

export = <T>() => new RootDataPipe<T>();
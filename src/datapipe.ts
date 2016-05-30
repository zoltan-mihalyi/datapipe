//todo use result only when necessary
//todo no context, no index, no list!
//todo asm.js
import Accumulator = require("./accumulator");
var filterMapBefore = ['data = []'];
var filterMapAfter = ['data.push(x);'];

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
        return this.mapLike<O>(['x = ', [fn], '(x);']);
    }

    filter(predicate:(t:T) => boolean):ChildDataPipe<R,T,T> {
        return this.subPipe<T>({
            rename: true,
            changesCount: true,
            before: filterMapBefore,
            after: filterMapAfter,
            text: ['if(!', [predicate], '(x)) continue;'],
            mergeStart: true,
            mergeEnd: true
        });
    }

    each(callback:(t:T)=>any):ChildDataPipe<R,T,T> {
        return this.subPipe<T>({
            text: [[callback], '(x);'], //todo use access where possible
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
            before: ['data = void 0;'],
            after: [],
            text: ['if(', [predicate], '(x)) {data = x; break;}'],
            mergeStart: true,
            mergeEnd: false
        }) as any;
    }

    take(count:number):ChildDataPipe<R,T,T> {
        return this.subPipe<T>({
            rename: true,
            usesCount: true,
            before: filterMapBefore,
            after: filterMapAfter,
            text: ['if (count>', [count], ') {break;}'],
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
        var text:CodeText;
        if (typeof method === 'string') {
            let accessor = JSON.stringify(method);
            text = [`x=x[${accessor}]==null?x[${accessor}]:x[${accessor}](`];
        } else {
            text = ['x=', [method], '.call(x' + (methodArgs.length ? ',' : '')];
        }

        for (var i = 1; i < arguments.length; i++) {
            text.push([arguments[i]]);
            if (i < arguments.length - 1) {
                text.push(',');
            }
        }
        text.push(');');

        return this.mapLike(text);
    }

    pluck(property:string|number):ChildDataPipe<R,T,any> {
        var propAccessor = JSON.stringify(property);
        return this.mapLike<any>([`x=x==null?void 0:x[${propAccessor}];`]);
    }


    min(fn:string|((x:T) => number)):DataPipeResult<R, T>;
    min():DataPipeResult<R, number>;
    min(iteratee?:(x:T) => number) {
        return this.edge('Infinity', '<', iteratee);
    }

    max(fn:string|((x:T) => number)):DataPipeResult<R, T>;
    max():DataPipeResult<R, number>;
    max(iteratee?:(x:T) => number) {
        return this.edge('-Infinity', '>', iteratee);
    }

    groupBy(fn:string|((x:T)=>string|number)):ChildDataPipe<R,T,{[index:string]:T[]}> {
        return this.reduceLike<{[index:string]:T[]}>(['{};'], ['var group=', ...access(fn), ';\nif(data[group]) {data[group].push(x);}\nelse {data[group]=[x];}'], false);
    }

    indexBy(fn:string|((x:T)=>string|number)):ChildDataPipe<R,T,{[index:string]:T}> {
        return this.reduceLike<{[index:string]:T}>(['{};'], ['data[', ...access(fn), ']=x;'], false); //todo dont care order?
    }

    sortBy(fn:string|((x:T)=>number)):ChildDataPipe<R,T,T> {
        //todo advanced logic, when used after map-like processors
        if (!fn) {
            return this.subPipe<T>(['data=data.sort();']);
        } else {
            return this.subPipe<T>(['data=data.sort(function(a,b){return ', ...access(fn, 'a'), '-', ...access(fn, 'b'), ';});']); //todo cache values??
        }
    }

    private edge(opposite:string, operator:string, fn?:string|((x:T)=>number)):DataPipeResult<R,any> {
        if (!fn) {
            return this.reduceLike([opposite], [`if(x${operator}data){data=x;}`], false) as any;
        }

        var text = ['var value=', ...access(fn), `;\nif(value${operator}edgeValue){edgeValue=value;data=x;}`];
        return this.reduceLike([`${opposite};\nvar edgeValue=${opposite};`], text, false) as any;
    }

    private everyLike(predicate:(t:T)=>boolean, inverted?:boolean):DataPipeResult<R, boolean> {
        var predicatePrefix = inverted ? '' : '!';
        var initial = inverted ? 'false' : 'true';
        var noMatch = inverted ? 'true' : 'false';
        return this.subPipe({
            rename: true,
            before: [`data = ${initial};`],
            after: [],
            text: ['if(', predicatePrefix, [predicate], `(x)) { data = ${noMatch}; break;}`],
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
        var memoProvider = '';
        if (!isPrimitive(memo)) {
            if (typeof memo !== 'function') {
                throw new Error('The memo should be primitive, or a provider function, otherwise reusing the datapipe should produce unexpected results.');
            } else {
                memoProvider = '()';
            }
        }
        return this.reduceLike([[memo], memoProvider + ';'], ['data = ', [reducer], '(data, x);'], reversed);
    }

    private reduceLike<X>(before:CodeText, text:CodeText, reversed:boolean):ChildDataPipe<R,T,X> {
        return this.subPipe<X>({
            rename: true,
            before: ['data = ', ...before],
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
            paramNames.push(Accumulator.paramName(i));
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
    var fn = 'return function(x){\n';
    for (let i in properties) {
        if (properties.hasOwnProperty(i)) {
            let propAccess = `[${escapeProperty(i)}]`;
            fn += `if(x${propAccess}!==properties${propAccess}) {return false;}\n`;
        }
    }
    fn += 'return true;\n};';

    function escapeProperty(property) {
        return JSON.stringify(property); //todo
    }

    return (new Function('properties', fn))(properties);
}

function access(fn:string|Function, variable?:string):CodeText {
    variable = variable || 'x';
    if (typeof fn === 'function') {
        return [[fn], `(${variable})`];
    } else {
        return [`${variable}[${JSON.stringify(fn)}]`];
    }
}

export = <T>() => new RootDataPipe<T>();
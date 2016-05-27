//todo use result only when necessary
//todo no context, no index, no list!
import Accumulator = require("./accumulator");
var filterMapBefore = ['data = []'];
var filterMapAfter = ['data.push(x);'];

interface DataPipeResult<R,T> {
    process(data:R[]):T;
    compile():DataPipeResult<R,T>;
}

abstract class DataPipe<R,P,T> implements DataPipeResult<R,T[]> {
    map<O>(fn:(t:T)=>O):ChildDataPipe<R,T,O> { //todo is there a correlation between fields?
        return this.subPipe<O>({
            rename: true,
            before: filterMapBefore,
            after: filterMapAfter,
            text: ['x = ', [fn], '(x);'],
            mergeStart: true,
            mergeEnd: true
        });
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
            text: [[callback], '(x);'],
            mergeStart: true,
            mergeEnd: true
        });
    }

    reduce<M>(reducer:(memo:M[], t:T)=>M[], memo:M[]):ChildDataPipe<R,T,M>;
    reduce<M>(reducer:(memo:M, t:T)=>M, memo:M):DataPipeResult<R,M>;
    reduce<M>(reducer:(memo:M, t:T)=>M, memo:M) {
        var memoProvider = '';
        if (!isPrimitive(memo)) {
            if (typeof memo !== 'function') {
                throw new Error('The memo should be primitive, or a provider function, otherwise reusing the datapipe should produce unexpected results.');
            } else {
                memoProvider = '()';
            }
        }
        return this.subPipe<M>({
            rename: true,
            before: ['data = ', [memo], memoProvider + ';'],
            after: [],
            text: ['data = ', [reducer], '(data, x);'],
            mergeStart: true,
            mergeEnd: false
        });
    }

    reduceRight<M>(reducer:(memo:M[], t:T)=>M[], memo:M[]):ChildDataPipe<R,T,M>;
    reduceRight<M>(reducer:(memo:M, t:T)=>M, memo:M):DataPipeResult<R,M>;
    reduceRight<M>(reducer:(memo:M, t:T)=>M, memo:M) {
        return this.subPipe<M>({
            rename: true,
            before: ['data = ', [memo]],
            after: [],
            text: ['data = ', [reducer], '(data, x);'],
            reversed: true,
            mergeStart: false, //TODO because iteration is reversed. Can be calculated from other properties?
            mergeEnd: false
        });
    }

    find(predicate:(t:T) => boolean):DataPipeResult<R,any> {
        return this.subPipe<any>({
            rename: true,
            before: ['data = void 0;'],
            after: [],
            text: ['if(', [predicate], '(x)) {data = x; break;}'],
            mergeStart: true,
            mergeEnd: false
        });
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
        var fn = 'return function(x){\n';
        for (let i in properties) {
            if (properties.hasOwnProperty(i)) {
                let propAccess = `[${escapeProperty(i)}]`;
                fn += `if(x${propAccess}!==properties${propAccess}) {return false;}\n`;
            }
        }
        fn += 'return true;\n};';
        console.log(fn);

        function escapeProperty(property) {
            return JSON.stringify(property); //todo
        }

        return this.filter((new Function('properties', fn))(properties));
    }

    abstract process(data:R[]):T[];

    abstract getCodes():Code[];

    abstract compile():DataPipe<R,P,T>;

    private subPipe<X>(code:Code):ChildDataPipe<R,T,X> {
        return new ChildDataPipe<R,T,X>(this, code);
    }
}

class ChildDataPipe<R,P,T> extends DataPipe<R,P,T> {
    private processor:Function = null;

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

    private createProcessor():Function {
        var codes:Code[] = this.getCodes();

        var params = [];
        var codeStr = '';
        var accumulator:Accumulator = new Accumulator();
        for (var i = 0; i < codes.length; i++) {
            var code:Code = codes[i];
            if (!accumulator.canPut(code)) {
                codeStr += accumulator.toCode();
                accumulator = new Accumulator();
            }
            accumulator.put(code, params);
        }
        codeStr += accumulator.toCode();


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

    getCodes():Code[] {
        return [];
    }
}

function isPrimitive(value:any) {
    return value === null || (typeof value !== 'function' && typeof value !== 'object');
}

export = <T>() => new RootDataPipe<T>();
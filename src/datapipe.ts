type CodeText = Array<string|{0:any}>;

type Code = {
    before?:CodeText;
    after?:CodeText;
    text:CodeText;
    mergeStart:boolean;
    mergeEnd:boolean;
    reversed?:boolean;
};

class Accumulator {
    before = '';
    text = '';
    after = '';
    lastMergeEnd = true;
    reversed:boolean = null;


    put(code:Code, params:any[]) {
        this.lastMergeEnd = code.mergeEnd;
        this.text += createCodeRow(code.text, params) + '\n';
        if (code.before) {
            this.before = createCodeRow(code.before, params) + '\n';
        }
        if (code.after) { //todo redundant
            this.after = createCodeRow(code.after, params) + '\n';
        }
        if (this.reversed === null) {
            this.reversed = !!code.reversed;
        }
    }

    canPut(code:Code) {
        return this.text === '' || this.lastMergeEnd && code.mergeStart;
    }

    toCode() {
        var loop = this.reversed ? 'var i = data.length-1; i >= 0; i--' : 'var i = 0; i < data.length; i++';
        return `${this.before}for(${loop}){\nvar x = data[i];\n${this.text}${this.after}}\ndata = result;`;
    }
}
//todo use result only when necessary
//todo no context, no index, no list!
var filterMapBefore = ['var result=[];'];
var filterMapAfter = ['result.push(x);'];

interface DataPipeResult<R,T> {
    process(data:R[]):T;
}

abstract class DataPipe<R,P,T> implements DataPipeResult<R,T[]> {
    map<O>(fn:(t:T)=>O):ChildDataPipe<R,T,O> { //todo is there a correlation between fields?
        return this.subPipe<O>({
            before: filterMapBefore,
            after: filterMapAfter,
            text: ['x = ', [fn], '(x);'],
            mergeStart: true,
            mergeEnd: true
        });
    }

    filter(predicate:(t:T) => boolean):ChildDataPipe<R,T,T> {
        return this.subPipe<T>({
            before: filterMapBefore,
            after: filterMapAfter,
            text: ['if(!', [predicate], '(x)) continue;'],
            mergeStart: true,
            mergeEnd: true
        });
    }

    each(callback:(t:T)=>any):DataPipe<R,T,T> {
        return this.subPipe<T>({
            before: ['var result = data;'],
            text: [[callback], '(x);'],
            mergeStart: true,
            mergeEnd: true
        });
    }

    reduce<M>(reducer:(memo:M[], t:T)=>M[], memo:M[]):ChildDataPipe<R,T,M>;
    reduce<M>(reducer:(memo:M, t:T)=>M, memo:M):DataPipeResult<R,M>;
    reduce<M>(reducer:(memo:M, t:T)=>M, memo:M) {
        return this.subPipe<M>({
            before: ['var result=', [memo]],
            after: [],
            text: ['result=', [reducer], '(result, x)'],
            mergeStart: true,
            mergeEnd: false
        });
    }

    reduceRight<M>(reducer:(memo:M[], t:T)=>M[], memo:M[]):ChildDataPipe<R,T,M>;
    reduceRight<M>(reducer:(memo:M, t:T)=>M, memo:M):DataPipeResult<R,M>;
    reduceRight<M>(reducer:(memo:M, t:T)=>M, memo:M) {
        return this.subPipe<M>({
            before: ['var result=', [memo]],
            after: [],
            text: ['result=', [reducer], '(result, x)'],
            reversed: true,
            mergeStart: false, //TODO because iteration is reversed. Can be calculated from other properties?
            mergeEnd: false
        });
    }

    find(predicate:(t:T) => boolean):DataPipeResult<R,any> {
        return this.subPipe<any>({
            before: ['var result=void 0;'],
            after: [],
            text: ['if(', [predicate], '(x)) {result=x; break;}'],
            mergeStart: true,
            mergeEnd: false
        });
    }

    abstract process(data:R[]):T[];

    abstract getCodes():Code[];

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

    getCodes():Code[] {
        return [];
    }
}

function paramName(index:number) {
    return '_p' + index;
}

function createCodeRow(text:CodeText, params:any[]) {
    var result = '';
    for (var j = 0; j < text.length; j++) {
        if (typeof text[j] === 'string') {
            result += text[j];
        } else {
            result += paramName(params.length);
            params.push(text[j][0]);
        }
    }
    return result;
}

export = <T>() => new RootDataPipe<T>();
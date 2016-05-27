type CodeText = Array<string|{0:any}>;

type Code = {
    before?:CodeText;
    after?:CodeText;
    text:CodeText;
    mergeStart:boolean;
    mergeEnd:boolean;
    reversed?:boolean;
    rename?:boolean;
    usesCount?:boolean;
    changesCount?:boolean;
};

class Accumulator {
    before = '';
    rows:string[] = [];
    after = '';
    lastMergeEnd = true;
    reversed:boolean = null;
    rename = false;
    isCountDirty = false;
    lastCountId = 0;
    counts = [];

    put(code:Code, params:any[]) {
        var text:CodeText = code.text;
        this.lastMergeEnd = code.mergeEnd;

        text = this.handleCount(code, text);

        this.rows.push(createCodeRow(text, params));
        if (code.before) {
            this.before = createCodeRow(code.before, params) + '\n';
        }
        this.rename = this.rename || code.rename;
        if (code.after) { //todo redundant
            this.after = '\n' + createCodeRow(code.after, params);
        }
        if (this.reversed === null) {
            this.reversed = !!code.reversed;
        }
    }

    private handleCount(code:Code, text:CodeText) {
        if (code.changesCount) {
            this.isCountDirty = true;
        }
        if (code.usesCount) {
            let countName:string;

            if (this.isCountDirty) {
                this.lastCountId++;
            }

            if (!this.isCountDirty && this.counts.length === 0) {
                countName = '(i+1)';
            } else {
                countName = this.getLastCountName();
            }

            if (this.isCountDirty) {
                this.counts.push(`var ${countName} = 0;\n`);
                this.rows.push(`${countName}++;`);
                this.isCountDirty = false;
            }
            text = copyAndReplace(text, /count/g, countName);
        }
        return text;
    }

    canPut(code:Code) {
        return this.rows.length === 0 || this.lastMergeEnd && code.mergeStart;
    }

    toCode() {
        var dataName = this.rename ? 'dataOld' : 'data';
        var rename = this.rename ? `var ${dataName} = data;\n` : '';
        var indexModifier = this.reversed ? `${dataName}.length-1-` : '';
        return `${rename}${this.before}${this.counts.join('')}for(var i = 0; i < ${dataName}.length; i++){\nvar x = ${dataName}[${indexModifier}i];\n${this.rows.join('\n')}${this.after}}`;
    }

    private getLastCountName() {
        return `i_${this.lastCountId}`;
    }
}
//todo use result only when necessary
//todo no context, no index, no list!
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

function isPrimitive(value:any) {
    return value === null || (typeof value !== 'function' && typeof value !== 'object');
}

function copyAndReplace(codeText:CodeText, search:RegExp, replacement):CodeText {
    var result = [];
    for (var i = 0; i < codeText.length; i++) {
        let fragment = codeText[i];
        if (typeof fragment === 'string') {
            fragment = (fragment as string).replace(search, replacement);
        }
        result.push(fragment);
    }
    return result;
}

export = <T>() => new RootDataPipe<T>();
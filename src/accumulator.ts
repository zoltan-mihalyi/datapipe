///<reference path="interfaces.ts"/>
import {CollectionType} from "./common";
import {
    codeTextToString,
    named,
    declare,
    result,
    empty,
    seq,
    code,
    itar,
    current,
    index,
    prop,
    itin,
    literal,
    minus,
    conditional,
    and,
    type,
    increment
} from "./code-helpers";
import {statement} from "./code-helpers";
interface AccumulatorStrategy {
    put(code:Code, params:any[]):void;
    canPut(code:Code):boolean;
    toCode():string;
}

class SimpleStrategy implements AccumulatorStrategy {
    private code:string = null;

    put(code:CodeText<any>, params:any[]):void {
        this.code = codeTextToString(code, params);
    }

    canPut(code:CodeText<any>):boolean {
        return this.code === null;
    }

    toCode():string {
        return this.code;
    }
}

class LoopStrategy implements AccumulatorStrategy {
    private before = '';
    private rows:string[] = [];
    private after = '';
    private lastMergeEnd = true;
    private reversed:boolean = null;
    private rename = false;
    private isIndexDirty = false;
    private indexDeclarations:CodeText<any>[] = [];

    constructor(private type:CollectionType) {
    }

    put(loop:Loop, params:any[]) {

        var text:CodeText<any> = loop.text;
        this.lastMergeEnd = loop.mergeEnd;

        if (loop.changesCount) {
            this.isIndexDirty = true;
        }
        if (loop.usesIndex) {
            text = this.replaceIndex(text);
        }

        this.rows.push(codeTextToString(text, params));
        if (loop.before) {
            this.before = codeTextToString(loop.before, params) + '\n';
        }
        this.rename = this.rename || loop.rename;
        if (loop.after) {
            this.after = '\n' + codeTextToString(loop.after, params);
        }
        if (this.reversed === null) {
            this.reversed = !!loop.reversed;
        }
    }

    canPut(code:Loop):boolean {
        return this.rows.length === 0 || this.lastMergeEnd && code.mergeStart;
    }

    toCode():string {
        var input:CodeText<any> = named(this.rename ? 'dataOld' : 'data');
        var rename:CodeText<void> = this.rename ? declare(input, result) : empty;
        var loops:CodeText<void>;

        var createLoop = (array:boolean):CodeText<void> => {
            let currentIndex:CodeText<number> = this.reversed ? minus(minus(prop<number>(input, 'length'), literal(1)), index) : index;
            var block:CodeText<void> = seq([
                declare(current, prop(input, currentIndex)),
                code(this.rows.join('')),
                code(this.after)
            ]);
            if (array) {
                return itar(input, block);
            } else {
                return itin(input, block);
            }
        };

        if (this.type === CollectionType.ARRAY) {
            loops = createLoop(true);
        } else if (this.type === CollectionType.MAP) {
            loops = createLoop(false);

        } else {
            loops = seq([
                conditional(
                    and(input, type(prop<boolean>(input, 'length'), 'number')),
                    createLoop(true),
                    createLoop(false)
                ),
            ]);
        }

        return codeTextToString(seq([
            rename,
            code(this.before),
            seq(this.indexDeclarations),
            loops
        ]), null);
    }

    private replaceIndex(text:CodeText<any>):CodeText<any> { //todo take with object
        var indexName:string;
        if (this.isIndexDirty) {
            indexName = this.getNextIndexName();
            let indexVariable = named<number>(indexName);
            this.indexDeclarations.push(declare(indexVariable, literal(-1)));
            this.rows.push(codeTextToString(statement(increment(indexVariable)), null)); //todo
            this.isIndexDirty = false;
        } else if (this.indexDeclarations.length > 0) {
            indexName = this.getIndexName();
        } else {
            return text;
        }
        return copyAndReplaceIndexNames(text, indexName);
    }

    private getNextIndexName() {
        return this.getIndexName(true);
    }

    private getIndexName(next?:boolean) {
        return `i_${this.indexDeclarations.length + (next ? 1 : 0)}`;
    }
}

class Accumulator {
    strategy:AccumulatorStrategy = null;

    put(parentType:CollectionType, code:Code, params:any[]):void {
        if (this.strategy === null) {
            this.strategy = new (strategyFactory(code))(parentType);
        }
        this.strategy.put(code, params);
    }

    canPut(code:Code):boolean {
        return this.strategy === null || (this.strategy instanceof strategyFactory(code) && this.strategy.canPut(code));
    }

    flush():string {
        var result = this.strategy.toCode();
        this.strategy = null;
        return result;
    }
}

function copyAndReplaceIndexNames(codeText:CodeText<any>, newIndexName:string):CodeText<any> {
    var result = [];
    var originalIndexName = index[0];
    for (var i = 0; i < codeText.length; i++) {
        let fragment = codeText[i];
        if (fragment === originalIndexName) {
            fragment = newIndexName;
        }
        result.push(fragment);
    }
    return result;
}

function isLoop(code:Code):code is Loop {
    return !!(code as Loop).text;
}

function strategyFactory(code:Code):{new(parentType?:CollectionType):AccumulatorStrategy} {
    if (isLoop(code)) {
        return LoopStrategy;
    }
    return SimpleStrategy;
}

export = Accumulator;
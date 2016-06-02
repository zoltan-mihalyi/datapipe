///<reference path="interfaces.ts"/>
import {CollectionType} from "./common";
import {
    codeTextToString,
    named,
    declare,
    result,
    empty,
    seq,
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
    increment,
    statement
} from "./code-helpers";
interface AccumulatorStrategy {
    put(code:Code):void;
    canPut(code:Code):boolean;
    toCode(params:any[]):string;
}

class SimpleStrategy implements AccumulatorStrategy {
    private code:CodeText<any> = null;

    put(code:CodeText<any>):void {
        this.code = code;
    }

    canPut(code:CodeText<any>):boolean {
        return this.code === null;
    }

    toCode(params:any[]):string {
        return codeTextToString(this.code, params);
    }
}

class LoopStrategy implements AccumulatorStrategy {
    private before:CodeText<any> = empty;
    private rows:CodeText<any>[] = [];
    private after:CodeText<any> = empty;
    private lastMergeEnd = true;
    private reversed:boolean = null;
    private rename = false;
    private isIndexDirty = false;
    private indexDeclarations:CodeText<any>[] = [];

    constructor(private type:CollectionType) {
    }

    put(loop:Loop) {

        var text:CodeText<any> = loop.text;
        this.lastMergeEnd = loop.mergeEnd;

        if (loop.changesIndex) {
            this.isIndexDirty = true;
        }
        if (loop.usesIndex) {
            text = this.replaceIndex(text);
        }

        this.rows.push(text);
        if (loop.before) {
            this.before = loop.before;
        }
        this.rename = this.rename || loop.rename;
        if (loop.after) {
            this.after = loop.after;
        }
        if (this.reversed === null) {
            this.reversed = !!loop.reversed;
        }
    }

    canPut(code:Loop):boolean {
        return this.rows.length === 0 || this.lastMergeEnd && code.mergeStart;
    }

    toCode(params:any[]):string {
        var input:CodeText<any> = named(this.rename ? 'dataOld' : 'data');
        var rename:CodeText<void> = this.rename ? declare(input, result) : empty;
        var loops:CodeText<void>;

        var createLoop = (array:boolean):CodeText<void> => {
            let currentIndex:CodeText<number> = this.reversed ? minus(minus(prop<number>(input, 'length'), literal(1)), index) : index;
            var block:CodeText<void> = seq([
                declare(current, prop(input, currentIndex)),
                seq(this.rows),
                this.after
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

        } else { //todo reuse parameters!!!
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
            this.before,
            seq(this.indexDeclarations),
            loops
        ]), params);
    }

    private replaceIndex(text:CodeText<any>):CodeText<any> {
        var indexName:string;
        if (this.isIndexDirty || this.type !== CollectionType.ARRAY) {
            indexName = this.getNextIndexName();
            let indexVariable = named<number>(indexName);
            this.indexDeclarations.push(declare(indexVariable, literal(-1)));
            this.rows.push(statement(increment(indexVariable)));
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

    put(parentType:CollectionType, code:Code):void {
        if (this.strategy === null) {
            this.strategy = new (strategyFactory(code))(parentType);
        }
        this.strategy.put(code);
    }

    canPut(code:Code):boolean {
        return this.strategy === null || (this.strategy instanceof strategyFactory(code) && this.strategy.canPut(code));
    }

    flush(params:any[]):string {
        var result = this.strategy.toCode(params);
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
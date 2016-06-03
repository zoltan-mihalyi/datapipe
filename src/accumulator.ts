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
    statement,
    arrayIndex
} from "./code-helpers";

var arrayIndexName:string = arrayIndex[0] as string;
var indexName:string = index[0] as string;

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

        if (containsIndex(text, true)) {
            text = this.replaceIndex(text);
        }

        if (loop.changesIndex) {
            this.isIndexDirty = true;
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
            this.before,
            seq(this.indexDeclarations),
            loops
        ]), params);
    }

    private replaceIndex(text:CodeText<any>):CodeText<any> {
        var newIndexName:string;
        var containsArrayIndex = containsIndex(text, false);
        var replaceNormalIndexes = this.isIndexDirty;
        if (replaceNormalIndexes || (this.type !== CollectionType.ARRAY && containsArrayIndex)) {//todo we should defer this until adding to loop in order to use loop type.
            newIndexName = this.getNextIndexName();
            let indexVariable = named<number>(newIndexName);
            this.indexDeclarations.push(declare(indexVariable, literal(-1)));
            this.rows.push(statement(increment(indexVariable)));
            this.isIndexDirty = false;
        } else if (this.indexDeclarations.length > 0) {
            replaceNormalIndexes = true;
            newIndexName = this.getIndexName();
        } else {
            if (containsArrayIndex) {
                return copyAndReplaceIndexNames(text, indexName, false);
            }
            return text;
        }
        return copyAndReplaceIndexNames(text, newIndexName, replaceNormalIndexes);
    }

    private getNextIndexName() {
        return this.getIndexName(true);
    }

    private getIndexName(next?:boolean) {
        return `i_${this.indexDeclarations.length - (next ? 0 : 1)}`;
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

function copyAndReplaceIndexNames(codeText:CodeText<any>, newIndexName:string, replaceNormalIndexes:boolean):CodeText<any> {
    var result = [];
    for (var i = 0; i < codeText.length; i++) {
        let fragment = codeText[i];
        if (fragment === arrayIndexName || (replaceNormalIndexes && fragment === indexName)) {
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

function containsIndex(text:CodeText<any>, considerNormalIndexes:boolean) {
    for (var i = 0; i < text.length; i++) {
        var fragment = text[i];
        if (fragment === arrayIndexName || (considerNormalIndexes && fragment === indexName)) {
            return true;
        }
    }
    return false;
}

export = Accumulator;
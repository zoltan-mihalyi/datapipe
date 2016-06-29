import {
    arrayIndex,
    index,
    empty,
    named,
    seq,
    declare,
    result,
    statement,
    increment,
    literal,
    itin,
    cont,
    br,
    itar,
    codeTextContains
} from "./code-helpers";

var arrayIndexName:string = arrayIndex[0] as string;
var keyIndexName:string = index[0] as string;

interface CodeBlockConstructor {
    new():CodeBlock;
}

class SimpleBlock implements CodeBlock {
    private code:CodeText<any> = null;

    put(code:CodeText<any>):void {
        this.code = code;
    }

    canPut(code:Code):boolean {
        return this.code === null;
    }

    getContext():Context {
        return {
            array: true //todo
        };
    }

    getCodeText():CodeText<any> {
        return this.code;
    }
}

abstract class LoopBlock implements CodeBlock {
    protected before:CodeText<any> = empty;
    protected rows:CodeText<any>[] = [];
    protected after:CodeText<any> = empty;
    protected arrayIndex:string = null;
    protected keyIndex:string = keyIndexName;
    protected createdArray:boolean = false;
    protected lengthDirty:boolean = false; //todo same as indexDirty?
    private indexDeclarations:CodeText<any>[] = [];
    private lastMergeEnd = true;
    private rename = false;

    put(loop:Loop):void {
        this.rename = this.rename || loop.rename;
        this.lastMergeEnd = loop.mergeEnd;
        var text:CodeText<any> = this.replaceIndexes(loop.text);

        this.lengthDirty = this.lengthDirty || changesLength(text);

        var creatingArray = loop.before && loop.before.indexOf('[]') !== -1; //todo

        if (!this.createdArray && creatingArray) {
            this.keyIndex = null;
        }

        if (changesIndex(text)) {
            this.arrayIndex = null;
            this.keyIndex = null; //todo only when creating array
        }

        this.rows.push(text);
        if (loop.before) {
            this.before = loop.before;
        }
        if (loop.after) {
            this.after = loop.after;
        }

        this.createdArray = creatingArray;
    }

    canPut(loop:Loop):boolean {
        return this.lastMergeEnd && loop.mergeStart;
    }

    getCodeText():CodeText<void> {
        var input:CodeText<any> = named(this.rename ? 'dataOld' : 'data');
        var rename:CodeText<void> = this.rename ? declare(input, result) : empty;
        var block:CodeText<void> = seq([seq(this.rows), this.after]);

        return seq([
            rename,
            seq(this.indexDeclarations),
            this.wrapLoop(this.before, input, block)
        ]);
    }

    getContext():Context {
        return {
            loop: {
                lengthDirty: this.lengthDirty
            },
            array: this.isArray()
        };
    }

    protected abstract isArray():boolean;

    protected abstract wrapLoop(init:CodeText<any>, inputCollection:CodeText<any>, block:CodeText<any>):CodeText<void>;

    private replaceIndexes(text:CodeText<any>):CodeText<any> {
        var result = [];
        for (var i = 0; i < text.length; i++) {
            var fragment = text[i];
            if (fragment === arrayIndexName) {
                this.ensureIndex(true);
                fragment = this.arrayIndex;
            } else if (fragment === keyIndexName) {
                this.ensureIndex(false);
                fragment = this.keyIndex;
            }
            result.push(fragment);
        }
        return result;
    }

    private ensureIndex(array:boolean) {
        if (array) {
            if (!this.arrayIndex) {
                this.arrayIndex = this.createIndex();
                if (!this.keyIndex) { //todo because take creates an array.
                    this.keyIndex = this.arrayIndex;
                }
            }
        } else {
            if (!this.keyIndex) {
                this.keyIndex = this.arrayIndex = this.createIndex();
            }
        }
    }

    private createIndex():string {
        var newIndexName = this.getNextIndexName();
        let indexVariable = named<number>(newIndexName);
        this.indexDeclarations.push(declare(indexVariable, literal(-1)));
        this.rows.push(statement(increment(indexVariable)));
        return newIndexName;
    }

    private getNextIndexName() {
        return `i_${this.indexDeclarations.length}`;
    }
}

class ArrayLoopBlock extends LoopBlock {
    private reversed:boolean = null;
    private ranges:LoopRange[] = [];

    constructor() {
        super();
        this.createdArray = true;
        this.arrayIndex = this.keyIndex;
    }

    put(loop:Loop) {
        super.put(loop);

        if (this.reversed === null) {
            this.reversed = !!loop.reversed;
        }

        if (loop.range) {
            this.ranges.push(loop.range);
        }
    }

    getCodeText():CodeText<void> {
        return super.getCodeText();
    }

    protected isArray():boolean {
        return true;
    }

    protected wrapLoop(init:CodeText<any>, input:CodeText<any>, block:CodeText<any>):CodeText<void> {
        return itar(init, input, block, {
            reversed: this.reversed,
            ranges: this.ranges
        });
    }
}

class MapLoopBlock extends LoopBlock { //todo reversed?
    protected wrapLoop(init:CodeText<any>, input:CodeText<any>, block:CodeText<any>):CodeText<void> {
        return seq([
            init,
            itin(input, block)
        ]);
    }

    protected isArray():boolean {
        return false;
    }
}

function changesIndex(text:CodeText<any>):boolean {
    return codeTextContains(text, cont);
}

function changesLength(text:CodeText<any>):boolean {
    return codeTextContains(text, cont) || codeTextContains(text, br);
}

function isLoop(code:Code):code is Loop {
    return !!(code as Loop).text;
}

export function codeBlockConstructor(code:Code, array:boolean):CodeBlockConstructor {
    if (isLoop(code)) {
        if (array) {
            return ArrayLoopBlock;
        } else {
            return MapLoopBlock;
        }
    }
    return SimpleBlock;
}
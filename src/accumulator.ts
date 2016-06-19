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
    conditional,
    and,
    type,
    increment,
    statement,
    arrayIndex,
    cont
} from "./code-helpers";

var arrayIndexName:string = arrayIndex[0] as string;
var keyIndexName:string = index[0] as string;

interface CodeBlockConstructor {
    new():CodeBlock;
}

interface CodeBlock {
    getContext():Context;
    put(code:Code):void;
    canPut(code:Code):boolean;
    getCodeText():CodeText<any>;
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
            array: true
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
        this.lengthDirty = this.lengthDirty || loop.changesLength;
        var text:CodeText<any> = this.replaceIndexes(loop.text);

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
        var rowsSequence = seq(this.rows);
        var declareCurrent = (usesCurrent(rowsSequence) || usesCurrent(this.after)) ? declare(current, prop(input, index)) : empty;
        var block:CodeText<void> = seq([
            declareCurrent,
            rowsSequence,
            this.after
        ]);
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
    private until:number = null;

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
        if (typeof loop.until === 'number') {
            if (this.until === null || loop.until < this.until) {
                this.until = loop.until;
            }
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
            until: this.until
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

class MultiCode {
    private arrayBlock:CodeBlock = null;
    private mapBlock:CodeBlock = null;
    private empty:boolean = true;

    constructor(private type:CollectionType) {
    }

    put(dynamicCode:DynamicCode) {
        this.putToBlock(dynamicCode, true);
        this.putToBlock(dynamicCode, false);
        this.empty = false;
    }

    canPut(dynamicCode:DynamicCode):boolean {
        return canPutTo(this.mapBlock, dynamicCode, false) && canPutTo(this.arrayBlock, dynamicCode, true);
    }

    toCode(params:any[]):string {
        var loops:CodeText<void>;

        if (this.type === CollectionType.ARRAY) {
            loops = this.arrayBlock.getCodeText();
        } else if (this.type === CollectionType.MAP) {
            loops = this.mapBlock.getCodeText();
        } else {
            loops = seq([
                conditional(
                    and(result, type(prop<boolean>(result, 'length'), 'number')),
                    this.arrayBlock.getCodeText(),
                    this.mapBlock.getCodeText()
                ),
            ]);
        }

        return codeTextToString(loops, params);
    }

    private putToBlock(dynamicCode:DynamicCode, array:boolean) {
        var collectionType = array ? CollectionType.ARRAY : CollectionType.MAP;
        var codeBlock = array ? this.arrayBlock : this.mapBlock;
        if (codeBlock === null && (this.type === CollectionType.UNKNOWN || this.type === collectionType)) {
            var code:Code;
            if (isProvider(dynamicCode)) {
                code = dynamicCode.createCode({array: array});
            } else {
                code = dynamicCode;
            }
            codeBlock = new (codeBlockConstructor(code, array))();
            this.setBlock(codeBlock, array);
        }
        putTo(codeBlock, dynamicCode);
    }

    private setBlock(block:CodeBlock, array:boolean) {
        if (array) {
            this.arrayBlock = block;
        } else {
            this.mapBlock = block;
        }
    }
}

class Accumulator {
    private multiCode:MultiCode = null;
    private text:string[] = [];
    private params:any[] = [];

    static isLoop(code:Code):code is Loop {
        return !!(code as Loop).text;
    }

    put(parentType:CollectionType, dynamicCode:DynamicCode):void {
        if (!this.canPut(dynamicCode)) {
            this.flush();
        }

        if (this.multiCode === null) {
            this.multiCode = new MultiCode(parentType);
        }
        this.multiCode.put(dynamicCode);
    }

    toCode():string {
        this.flush();
        return this.text.join('');
    }

    getParams():any[] {
        return this.params;
    }

    private canPut(dynamicCode:DynamicCode):boolean {
        return this.multiCode === null || this.multiCode.canPut(dynamicCode);
    }

    private flush() {
        this.text.push(this.multiCode.toCode(this.params));
        this.multiCode = null;
    }
}

function codeBlockConstructor(code:Code, array:boolean):CodeBlockConstructor {
    if (Accumulator.isLoop(code)) {
        if (array) {
            return ArrayLoopBlock;
        } else {
            return MapLoopBlock;
        }
    }
    return SimpleBlock;
}

function changesIndex(text:CodeText<any>):boolean {
    return codeTextContains(text, cont);
}

function usesCurrent(text:CodeText<any>):boolean {
    return codeTextContains(text, current);
}

function codeTextContains(text:CodeText<any>, part:CodeText<any>):boolean {
    var name = part[0];
    for (var i = 0; i < text.length; i++) {
        var fragment = text[i];
        if (fragment === name) {
            return true;
        }
    }
    return false;
}

function isProvider(code:DynamicCode):code is CodeProvider {
    return typeof (code as CodeProvider).createCode === 'function';
}

function putTo(codeBlock:CodeBlock, dynamicCode:DynamicCode) {
    if (codeBlock === null) {
        return;
    }
    var code:Code;
    if (isProvider(dynamicCode)) {
        code = dynamicCode.createCode(codeBlock.getContext()) as Code;
    } else {
        code = dynamicCode as Code;
    }
    codeBlock.put(code);
}

function canPutTo(codeBlock:CodeBlock, dynamicCode:DynamicCode, array:boolean):boolean {
    var code:Code;

    if (codeBlock === null) {
        return true;
    }

    if (isProvider(dynamicCode)) {
        code = dynamicCode.createCode(codeBlock.getContext());
    } else {
        code = dynamicCode;
        if (!(codeBlock instanceof codeBlockConstructor(code, array))) {
            return false;
        }
    }

    return codeBlock.canPut(code);
}

export = Accumulator;
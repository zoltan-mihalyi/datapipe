///<reference path="interfaces.ts"/>
import {CollectionType, isProvider} from "./common";
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
    cont,
    br
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
                lengthDirty: this.lengthDirty,
                from: this.getFrom()
            },
            array: this.isArray()
        };
    }

    protected getFrom():number {
        return 0;
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
    private from:number = 0;
    private cutEnd:number = 0;

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
        if (typeof loop.from === 'number') {
            this.from += loop.from;
        }
        if (typeof loop.cutEnd === 'number') {
            this.cutEnd += loop.cutEnd;
        }
    }

    getCodeText():CodeText<void> {
        return super.getCodeText();
    }

    protected getFrom():number {
        return this.from;
    }

    protected isArray():boolean {
        return true;
    }

    protected wrapLoop(init:CodeText<any>, input:CodeText<any>, block:CodeText<any>):CodeText<void> {
        return itar(init, input, block, {
            reversed: this.reversed,
            until: this.until,
            from: this.from,
            cutEnd: this.cutEnd
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

function matchesType(type:CollectionType, collectionType:CollectionType) {
    return type === CollectionType.UNKNOWN || type === collectionType;
}

class MultiCode {
    private arrayBlock:CodeBlock[] = [];
    private mapBlock:CodeBlock[] = [];
    private empty:boolean = true;

    constructor(private type:CollectionType) {
    }

    put(dynamicCode:DynamicCode, needs:Needs, parentType:CollectionType) {
        this.putToBlock(dynamicCode, needs, parentType, true);
        this.putToBlock(dynamicCode, needs, parentType, false);
        this.empty = false;
    }

    canPut(dynamicCode:DynamicCode, needs:Needs):boolean {
        return canPutTo(this.mapBlock, dynamicCode, needs, false) || canPutTo(this.arrayBlock, dynamicCode, needs, true);
    }

    toCode(params:any[]):string {
        var loops:CodeText<void>;

        if (this.type === CollectionType.ARRAY) {
            loops = getCodeTexts(this.arrayBlock);
        } else if (this.type === CollectionType.MAP) {
            loops = getCodeTexts(this.mapBlock);
        } else {
            var arrayText = getCodeTexts(this.arrayBlock);
            var mapText = getCodeTexts(this.mapBlock);

            if (codeTextEquals(arrayText, mapText)) {
                loops = arrayText;
            } else {
                loops = seq([
                    conditional(
                        and(result, type(prop<boolean>(result, 'length'), 'number')),
                        arrayText,
                        mapText
                    ),
                ]);
            }
        }

        return codeTextToString(loops, params);
    }

    private putToBlock(dynamicCode:DynamicCode, needs:Needs, parentType:CollectionType, array:boolean) {
        var collectionType = array ? CollectionType.ARRAY : CollectionType.MAP;
        var codeBlocks:CodeBlock[] = array ? this.arrayBlock : this.mapBlock;

        var shouldCreateCodeBlock = codeBlocks.length === 0 || !canPutTo(codeBlocks, dynamicCode, needs, array);
        if (shouldCreateCodeBlock && matchesType(this.type, collectionType)) {
            var code:Code;
            if (isProvider(dynamicCode)) {
                code = dynamicCode.createCode({array: array}, needs);
            } else {
                code = dynamicCode;
            }
            var isArrayBlock = array;
            if (codeBlocks.length > 0) {
                isArrayBlock = parentType === CollectionType.ARRAY
            }
            this.addBlock(new (codeBlockConstructor(code, isArrayBlock))(), array);
        }
        putTo(codeBlocks, dynamicCode, needs);
    }

    private addBlock(block:CodeBlock, array:boolean) {
        (array ? this.arrayBlock : this.mapBlock).push(block);
    }
}

class Accumulator {
    private multiCode:MultiCode = null;
    private text:string[] = [];
    private params:any[] = [];

    static isLoop(code:Code):code is Loop {
        return !!(code as Loop).text;
    }

    put(parentType:CollectionType, dynamicCode:DynamicCode, needs:Needs):void {
        if (!this.canPut(dynamicCode, needs)) {
            this.flush();
        }

        if (this.multiCode === null) {
            this.multiCode = new MultiCode(parentType);
        }
        this.multiCode.put(dynamicCode, needs, parentType);
    }

    toCode():string {
        this.flush();
        return this.text.join('');
    }

    getParams():any[] {
        return this.params;
    }

    private canPut(dynamicCode:DynamicCode, needs:Needs):boolean {
        return this.multiCode === null || this.multiCode.canPut(dynamicCode, needs);
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

function changesLength(text:CodeText<any>):boolean {
    return codeTextContains(text, cont) || codeTextContains(text, br);
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

function codeTextEquals(text1:CodeText<any>, text2:CodeText<any>):boolean {
    if (text1.length !== text2.length) {
        return false;
    }
    for (var i = 0; i < text1.length; i++) {
        if (text1[i] !== text2[i]) {
            return false;
        }
    }
    return true;
}

function putTo(codeBlocks:CodeBlock[], dynamicCode:DynamicCode, needs:Needs) {
    if (codeBlocks.length === 0) {
        return;
    }
    var codeBlock = last(codeBlocks);
    var code:Code;
    if (isProvider(dynamicCode)) {
        code = dynamicCode.createCode(codeBlock.getContext(), needs);
    } else {
        code = dynamicCode;
    }
    codeBlock.put(code);
}

function canPutTo(codeBlocks:CodeBlock[], dynamicCode:DynamicCode, needs:Needs, array:boolean):boolean {
    var code:Code;

    if (codeBlocks.length === 0) {
        return true;
    }

    var codeBlock = last(codeBlocks);

    if (isProvider(dynamicCode)) {
        code = dynamicCode.createCode(codeBlock.getContext(), needs);
    } else {
        code = dynamicCode;
        if (!(codeBlock instanceof codeBlockConstructor(code, array))) {
            return false;
        }
    }

    return codeBlock.canPut(code);
}

function last<T>(array:T[]):T {
    return array[array.length - 1];
}

function getCodeTexts(codeBlocks:CodeBlock[]):CodeText<any> {
    var results:CodeText<any>[] = [];

    for (var i = 0; i < codeBlocks.length; i++) {
        var codeBlock = codeBlocks[i];
        results.push(codeBlock.getCodeText());
    }

    return seq(results);
}

export = Accumulator;
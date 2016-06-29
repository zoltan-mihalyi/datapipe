///<reference path="interfaces.ts"/>
import {CollectionType, isProvider} from "./common";
import {codeTextToString, result, seq, prop, conditional, and, type} from "./code-helpers";
import {codeBlockConstructor} from "./code-blocks";

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
        return (matchesType(this.type, CollectionType.MAP) && canPutTo(this.mapBlock, dynamicCode, needs, false))
            || (matchesType(this.type, CollectionType.ARRAY) && canPutTo(this.arrayBlock, dynamicCode, needs, true));
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
                isArrayBlock = parentType === CollectionType.ARRAY;
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

function matchesType(type:CollectionType, collectionType:CollectionType) {
    return type === CollectionType.UNKNOWN || type === collectionType;
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
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

interface AccumulatorStrategy {
    put(code:DynamicCode):void;
    canPut(code:DynamicCode):boolean;
    toCode(params:any[]):string;
}

interface StrategyFactory {
    new(parentType?:CollectionType):AccumulatorStrategy;
}

class SimpleStrategy implements AccumulatorStrategy {
    private code:CodeText<any> = null;

    put(code:CodeText<any>):void {
        this.code = code;
    }

    canPut():boolean {
        return this.code === null;
    }

    toCode(params:any[]):string {
        return codeTextToString(this.code, params);
    }
}

abstract class GeneralLoop {
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

    put(loop:Loop) {
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

    createLoop():CodeText<void> {
        var input:CodeText<any> = named(this.rename ? 'dataOld' : 'data');
        var rename:CodeText<void> = this.rename ? declare(input, result) : empty;
        var block:CodeText<void> = seq([
            declare(current, prop(input, index)),
            seq(this.rows),
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
                array: this.isArray(),
                lengthDirty: this.lengthDirty
            }
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

class ArrayLoop extends GeneralLoop {
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

    createLoop():CodeText<void> {
        return super.createLoop();
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

class MapLoop extends GeneralLoop { //todo reversed?
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

class LoopStrategy implements AccumulatorStrategy {
    private arrayLoop:ArrayLoop = null;
    private mapLoop:MapLoop = null;
    private empty:boolean = true;

    constructor(private type:CollectionType) {
        if (type === CollectionType.ARRAY || type === CollectionType.UNKNOWN) {
            this.arrayLoop = new ArrayLoop();
        }
        if (type === CollectionType.MAP || type === CollectionType.UNKNOWN) {
            this.mapLoop = new MapLoop();
        }
    }

    put(dynamicCode:DynamicCode) {
        putTo(this.arrayLoop, dynamicCode);
        putTo(this.mapLoop, dynamicCode);
        this.empty = false;
    }

    canPut(dynamicCode:DynamicCode):boolean {
        return canPutTo(this.mapLoop, dynamicCode) && canPutTo(this.arrayLoop, dynamicCode);
    }

    toCode(params:any[]):string {
        var loops:CodeText<void>;

        if (this.type === CollectionType.ARRAY) {
            loops = this.arrayLoop.createLoop();
        } else if (this.type === CollectionType.MAP) {
            loops = this.mapLoop.createLoop();
        } else {
            loops = seq([
                conditional(
                    and(result, type(prop<boolean>(result, 'length'), 'number')),
                    this.arrayLoop.createLoop(),
                    this.mapLoop.createLoop()
                ),
            ]);
        }

        return codeTextToString(loops, params);
    }
}

class Accumulator {
    private strategy:AccumulatorStrategy = null;
    private text:string[] = [];
    private params:any[] = [];

    static isLoop(code:Code):code is Loop {
        return !!(code as Loop).text;
    }

    put(parentType:CollectionType, dynamicCode:DynamicCode):void {
        if (!this.canPut(dynamicCode)) {
            this.flush();
        }

        if (this.strategy === null) {
            if (isProvider(dynamicCode)) {
                this.strategy = new LoopStrategy(parentType); //todo provider can define default type
            } else {
                this.strategy = new (strategyFactory(dynamicCode))(parentType);
            }
        }
        this.strategy.put(dynamicCode);
    }

    toCode():string {
        this.flush();
        return this.text.join('');
    }

    getParams():any[] {
        return this.params;
    }

    private canPut(code:DynamicCode):boolean {
        if (isProvider(code)) {
            return this.strategy === null || this.strategy.canPut(code);
        } else {
            return this.strategy === null || (this.strategy instanceof strategyFactory(code) && this.strategy.canPut(code));
        }
    }

    private flush() {
        this.text.push(this.strategy.toCode(this.params));
        this.strategy = null;
    }
}

function strategyFactory(code:Code):StrategyFactory {
    if (Accumulator.isLoop(code)) {
        return LoopStrategy;
    }
    return SimpleStrategy;
}

function changesIndex(text:CodeText<any>):boolean {
    for (var i = 0; i < text.length; i++) {
        var fragment = text[i];
        var continueName = cont[0];
        if (fragment === continueName) {
            return true;
        }
    }
    return false;
}

function isProvider(code:DynamicCode):code is CodeProvider {
    return typeof (code as CodeProvider).createCode === 'function';
}

function putTo(generalLoop:GeneralLoop, dynamicCode:DynamicCode) {
    if (generalLoop === null) {
        return;
    }
    var loop:Loop;
    if (isProvider(dynamicCode)) {
        loop = dynamicCode.createCode(generalLoop.getContext()) as Loop;
    } else {
        loop = dynamicCode as Loop;
    }
    generalLoop.put(loop);
}

function canPutTo(loop:GeneralLoop, dynamicCode:DynamicCode):boolean {
    var code:Code;
    if (isProvider(dynamicCode)) {
        if (!loop) {
            return true;
        }
        code = dynamicCode.createCode(loop.getContext());
    } else {
        code = dynamicCode;
    }

    return loop === null || loop.canPut(code as Loop);

}

export = Accumulator;
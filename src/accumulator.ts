///<reference path="interfaces.ts"/>
import {CollectionType, filterMapBefore, filterMapAfter} from "./common";
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
    setResult,
    call
} from "./code-helpers";

var arrayIndexName:string = arrayIndex[0] as string;
var keyIndexName:string = index[0] as string;

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

abstract class GeneralLoop {
    protected before:CodeText<any> = empty;
    protected rows:CodeText<any>[] = [];
    protected after:CodeText<any> = empty;
    private indexDeclarations:CodeText<any>[] = [];
    protected arrayIndex:string = null;
    protected keyIndex:string = keyIndexName;

    protected createdArray:boolean = false;

    put(loop:Loop) {
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

    createLoop(inputCollection:CodeText<any>):CodeText<void> {
        var block:CodeText<void> = seq([
            declare(current, prop(inputCollection, index)),
            seq(this.rows),
            this.after
        ]);
        return seq([
            this.before,
            seq(this.indexDeclarations),
            this.wrapLoop(inputCollection, block)
        ]);
    }

    protected abstract wrapLoop(inputCollection:CodeText<any>, block:CodeText<any>):CodeText<void>;

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
    }

    createLoop(inputCollection:CodeText<any>):CodeText<void> {
        if (!this.reversed && this.everyRowIsEmpty() && this.before === filterMapBefore && this.after === filterMapAfter) {
            return setResult(call(prop<()=>any>(result, 'slice')));
        }
        return super.createLoop(inputCollection);
    }

    protected wrapLoop(input:CodeText<any>, block:CodeText<any>):CodeText<void> {
        return itar(input, block, this.reversed);
    }

    private everyRowIsEmpty():boolean {
        for (var i = 0; i < this.rows.length; i++) {
            if (this.rows[i].length !== 0) {
                return false;
            }
        }
        return true;
    }
}

class MapLoop extends GeneralLoop { //todo reversed?
    protected wrapLoop(input:CodeText<any>, block:CodeText<any>):CodeText<void> {
        return itin(input, block);
    }
}

class LoopStrategy implements AccumulatorStrategy {
    private lastMergeEnd = true;
    private rename = false;
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

    put(loop:Loop) {
        this.rename = this.rename || loop.rename;
        this.lastMergeEnd = loop.mergeEnd;

        if (this.arrayLoop !== null) {
            this.arrayLoop.put(loop);
        }
        if (this.mapLoop !== null) {
            this.mapLoop.put(loop);
        }
        this.empty = false;
    }

    canPut(code:Loop):boolean {
        return this.empty || this.lastMergeEnd && code.mergeStart;
    }

    toCode(params:any[]):string {
        var input:CodeText<any> = named(this.rename ? 'dataOld' : 'data'); //todo deeper
        var rename:CodeText<void> = this.rename ? declare(input, result) : empty;
        var loops:CodeText<void>;

        if (this.type === CollectionType.ARRAY) {
            loops = this.arrayLoop.createLoop(input);
        } else if (this.type === CollectionType.MAP) {
            loops = this.mapLoop.createLoop(input);
        } else {
            loops = seq([
                conditional(
                    and(input, type(prop<boolean>(input, 'length'), 'number')),
                    this.arrayLoop.createLoop(input),
                    this.mapLoop.createLoop(input)
                ),
            ]);
        }

        return codeTextToString(seq([
            rename,
            loops
        ]), params);
    }
}

class Accumulator {
    strategy:AccumulatorStrategy = null;

    static isLoop(code:Code):code is Loop {
        return !!(code as Loop).text;
    }

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

function strategyFactory(code:Code):{new(parentType?:CollectionType):AccumulatorStrategy} {
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

export = Accumulator;
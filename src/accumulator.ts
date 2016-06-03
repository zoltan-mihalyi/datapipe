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
    arrayIndex,
    cont
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

class LoopStrategy implements AccumulatorStrategy {
    private before:CodeText<any> = empty;
    private rows:CodeText<any>[] = [];
    private after:CodeText<any> = empty;
    private lastMergeEnd = true;
    private reversed:boolean = null;
    private rename = false;
    private indexDeclarations:CodeText<any>[] = [];

    private arrayIndex:string = null;
    private keyIndex:string = keyIndexName;

    private createdArray:boolean = false;

    constructor(private type:CollectionType) {
        if (type === CollectionType.ARRAY) {
            this.arrayIndex = this.keyIndex;
        }
    }

    put(loop:Loop) {

        var text:CodeText<any> = loop.text;
        this.lastMergeEnd = loop.mergeEnd;

        text = this.replaceIndexes(text);

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
        this.rename = this.rename || loop.rename;
        if (loop.after) {
            this.after = loop.after;
        }
        if (this.reversed === null) {
            this.reversed = !!loop.reversed;
        }

        this.createdArray = creatingArray;
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
                if (!this.keyIndex) {
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

function isLoop(code:Code):code is Loop {
    return !!(code as Loop).text;
}

function strategyFactory(code:Code):{new(parentType?:CollectionType):AccumulatorStrategy} {
    if (isLoop(code)) {
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
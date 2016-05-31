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
    and
} from "./code-helpers";
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
    private isCountDirty = false;
    private lastCountId = 0;
    private counts = [];
    private type:CollectionType = CollectionType.UNKNOWN;

    put(loop:Loop, params:any[]) {

        var text:CodeText<any> = loop.text;
        this.lastMergeEnd = loop.mergeEnd;

        text = this.handleCount(loop, text);

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

    private handleCount(loop:Loop, text:CodeText<any>) {
        if (loop.changesCount) {
            this.isCountDirty = true;
        }
        if (loop.usesCount) {
            let countName:string;

            if (this.isCountDirty) {
                this.lastCountId++;
            }

            if (!this.isCountDirty && this.counts.length === 0) {
                countName = '(i+1)';
            } else {
                countName = this.getLastCountName();
            }

            if (this.isCountDirty) {
                this.counts.push(`var ${countName} = 0;\n`);
                this.rows.push(`${countName}++;`);
                this.isCountDirty = false;
            }
            text = copyAndReplace(text, /count/g, countName);
        }
        return text;
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
                    and(input, prop<boolean>(input, 'length')),
                    createLoop(true),
                    createLoop(false)
                ), //todo no itin when empty array
            ]);
        }

        return codeTextToString(seq([
            rename,
            code(this.before),
            code(this.counts.join('')),
            loops
        ]), null);
    }

    private getLastCountName() {
        return `i_${this.lastCountId}`;
    }
}

class Accumulator {
    strategy:AccumulatorStrategy = null;

    put(code:Code, params:any[]):void {
        if (this.strategy === null) {
            this.strategy = new (strategyFactory(code))();
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

function copyAndReplace(codeText:CodeText<any>, search:RegExp, replacement):CodeText<any> { //todo change
    var result = [];
    for (var i = 0; i < codeText.length; i++) {
        let fragment = codeText[i];
        if (typeof fragment === 'string') {
            fragment = (fragment as string).replace(search, replacement);
        }
        result.push(fragment);
    }
    return result;
}

function isLoop(code:Code):code is Loop {
    return !!(code as Loop).text;
}

function strategyFactory(code:Code):{new():AccumulatorStrategy} {
    if (isLoop(code)) {
        return LoopStrategy;
    }
    return SimpleStrategy;
}

export = Accumulator;
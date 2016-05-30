///<reference path="interfaces.ts"/>
interface AccumulatorStrategy {
    put(code:Code, params:any[]):void;
    canPut(code:Code):boolean;
    toCode():string;
}

class SimpleStrategy implements AccumulatorStrategy {
    private code:string = null;

    put(code:CodeText, params:any[]):void {
        this.code = createCodeRow(code, params);
    }

    canPut(code:CodeText):boolean {
        return this.code === null;
    }

    toCode():string {
        return this.code;
    }
}

class LoopStrategy implements AccumulatorStrategy {
    before = '';
    rows:string[] = [];
    after = '';
    lastMergeEnd = true;
    reversed:boolean = null;
    rename = false;
    isCountDirty = false;
    lastCountId = 0;
    counts = [];

    put(loop:Loop, params:any[]) {

        var text:CodeText = loop.text;
        this.lastMergeEnd = loop.mergeEnd;

        text = this.handleCount(loop, text);

        this.rows.push(createCodeRow(text, params));
        if (loop.before) {
            this.before = createCodeRow(loop.before, params) + '\n';
        }
        this.rename = this.rename || loop.rename;
        if (loop.after) {
            this.after = '\n' + createCodeRow(loop.after, params);
        }
        if (this.reversed === null) {
            this.reversed = !!loop.reversed;
        }
    }

    private handleCount(loop:Loop, text:CodeText) {
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
        var dataName = this.rename ? 'dataOld' : 'data';
        var rename = this.rename ? `var ${dataName} = data;\n` : '';
        var indexModifier = this.reversed ? `${dataName}.length-1-` : '';
        return `${rename}${this.before}${this.counts.join('')}for(var i = 0; i < ${dataName}.length; i++){\nvar x = ${dataName}[${indexModifier}i];\n${this.rows.join('\n')}${this.after}}`;
    }

    private getLastCountName() {
        return `i_${this.lastCountId}`;
    }
}

class Accumulator {
    strategy:AccumulatorStrategy = null;

    static paramName(index:number) {
        return '_p' + index;
    }

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

function createCodeRow(text:CodeText, params:any[]):string {
    var result = '';
    for (var j = 0; j < text.length; j++) {
        if (typeof text[j] === 'string') {
            result += text[j];
        } else {
            result += Accumulator.paramName(params.length);
            params.push(text[j][0]);
        }
    }
    return result;
}

function copyAndReplace(codeText:CodeText, search:RegExp, replacement):CodeText {
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
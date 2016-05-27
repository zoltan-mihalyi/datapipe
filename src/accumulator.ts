///<reference path="interfaces.ts"/>

class Accumulator {
    before = '';
    rows:string[] = [];
    after = '';
    lastMergeEnd = true;
    reversed:boolean = null;
    rename = false;
    isCountDirty = false;
    lastCountId = 0;
    counts = [];

    static paramName(index:number) {
        return '_p' + index;
    }

    put(code:Code, params:any[]) {
        var text:CodeText = code.text;
        this.lastMergeEnd = code.mergeEnd;

        text = this.handleCount(code, text);

        this.rows.push(createCodeRow(text, params));
        if (code.before) {
            this.before = createCodeRow(code.before, params) + '\n';
        }
        this.rename = this.rename || code.rename;
        if (code.after) { //todo redundant
            this.after = '\n' + createCodeRow(code.after, params);
        }
        if (this.reversed === null) {
            this.reversed = !!code.reversed;
        }
    }

    private handleCount(code:Code, text:CodeText) {
        if (code.changesCount) {
            this.isCountDirty = true;
        }
        if (code.usesCount) {
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

    canPut(code:Code) {
        return this.rows.length === 0 || this.lastMergeEnd && code.mergeStart;
    }

    toCode() {
        var dataName = this.rename ? 'dataOld' : 'data';
        var rename = this.rename ? `var ${dataName} = data;\n` : '';
        var indexModifier = this.reversed ? `${dataName}.length-1-` : '';
        return `${rename}${this.before}${this.counts.join('')}for(var i = 0; i < ${dataName}.length; i++){\nvar x = ${dataName}[${indexModifier}i];\n${this.rows.join('\n')}${this.after}}`;
    }

    private getLastCountName() {
        return `i_${this.lastCountId}`;
    }
}

function createCodeRow(text:CodeText, params:any[]) {
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

export = Accumulator;
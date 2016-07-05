///<reference path="interfaces.ts"/>
import DataPipe = require('./datapipe');
import {Step, CollectionType, ResultCreation, isProvider} from "./common";
import {setResult, prop, result, literal, empty, increment, paramName} from "./code-helpers";
import Accumulator = require("./accumulator");

const NEEDS_ALL:NeedsProvider = () => {
    return {};
};

const SIZE_CODE_PROVIDER:CodeProvider = {
    createCode: (ctx:Context)=> {
        if (ctx.array) {
            return setResult(prop<number>(result, 'length'));
        } else {
            return {
                before: setResult(literal(0)),
                after: increment(result),
                text: empty,
                mergeStart: true,
                mergeEnd: false,
                rename: true
            };
        }
    },
    handlesSize: true
};

class ChildDataPipe<R,T> extends DataPipe<R,T> {
    private processor:Mapper<R,T> = null;
    private newResult:boolean;
    private needsProvider:NeedsProvider;

    constructor(type:CollectionType, private parent:DataPipe<R,any>, private code:DynamicCode, resultCreation:ResultCreation, np?:NeedsProvider) {
        super(type);
        switch (resultCreation) {
            case ResultCreation.NEW_OBJECT:
                this.newResult = true;
                break;
            case ResultCreation.USES_PREVIOUS:
                this.newResult = this.parent.hasNewResult();
                break;
            case ResultCreation.EXISTING_OBJECT:
                this.newResult = false;
                break;
        }

        this.needsProvider = np || NEEDS_ALL;
    }

    process(data:R[]):T[] {
        this.compile();
        return this.processor(data);
    }

    compile():ChildDataPipe<R,T> {
        if (this.processor === null) {
            this.processor = this.createProcessor();
        }
        return this;
    }

    fn():Mapper<R,T> {
        return this.compile().processor;
    }

    getSteps():Step[] {
        var codes = this.parent.getSteps();
        codes.push({
            code: this.code,
            parentType: this.parent.type,
            needsProvider: this.needsProvider
        });
        return codes;
    }

    hasNewResult():boolean {
        return this.newResult;
    }

    private createProcessor():Mapper<R,T> {
        var steps:Step[] = this.getSteps();

        var needs = this.processNeeds(steps);

        var accumulator:Accumulator = new Accumulator();
        for (var i = 0; i < steps.length; i++) {
            let step:Step = steps[i];
            if (needs.lengthTransformations[i]) {
                accumulator.put(steps[i].parentType, SIZE_CODE_PROVIDER, {});
            }

            accumulator.put(step.parentType, step.code, needs.byIndex[i]);
        }
        var codeStr:string = accumulator.toCode();
        var params:any[] = accumulator.getParams();

        var fnBody = `return function(data){\n${codeStr}\nreturn data;\n}`;
        var paramNames = [];
        for (let i = 0; i < params.length; i++) {
            paramNames.push(paramName(i));
        }
        return (new Function(paramNames.join(','), fnBody)).apply(null, params);
    }

    private processNeeds(steps:Step[]) {
        var needs:Needs = {};
        var needsByIndex:Needs[] = [];

        var lengthTransformations = {};

        for (var i = steps.length - 1; i >= 0; --i) {
            let step = steps[i];

            needsByIndex[i] = needs;
            needs = step.needsProvider(needs);

            if (needs.size && (i === 0 || !handlesSize(steps[i - 1]))) {
                lengthTransformations[i] = true;
            }
        }

        function handlesSize(step:Step):boolean {
            var code:DynamicCode = step.code;
            return isProvider(code) && code.handlesSize;
        }

        return {
            byIndex: needsByIndex,
            lengthTransformations: lengthTransformations
        };
    }
}
export = ChildDataPipe;
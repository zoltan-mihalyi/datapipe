import {CollectionType} from "./common";
var push = Array.prototype.push;

export type Operator<P,R> = (a:CodeText<P>, b:CodeText<P>) => CodeText<R>;

function operator<P,R>(op:string):Operator<P,R> {
    return function (a:CodeText<P>, b:CodeText<P>):CodeText<R> {
        return [...a, op, ...b];
    };
}

function operatorWithNullValue(op:string, nullValue:number):Operator<number,number> {
    return function (a:CodeText<number>, b:CodeText<number>):CodeText<number> {
        if (isNumberLiteral(a, nullValue)) {
            return b;
        }
        if (isNumberLiteral(b, nullValue)) {
            return a;
        }

        return [...a, op, ...b];
    };
}

function prefixOperator<I,O>(prefix):(text:CodeText<I>)=>CodeText<O> {
    return function (text:CodeText<I>):CodeText<O> {
        return [prefix, ...text];
    };
}

function suffixOperator<I,O>(suffix):(text:CodeText<I>)=>CodeText<O> {
    return function (text:CodeText<I>):CodeText<O> {
        return [...text, suffix];
    };
}

export var eql = operator<any,boolean>('==');
export var eq = operator<any,boolean>('===');
export var neql = operator<any,boolean>('!=');
export var neq = operator<any,boolean>('!==');
export var lt = operator<number,boolean>('<');
export var gt = operator<number, boolean>('>');
export var gte = operator<number, boolean>('>=');
export var subtract = operatorWithNullValue('-', 0);
export var add = operatorWithNullValue('+', 0);
export var multiply = operator<number,number>('*');
export var divide = operator<number,number>('/');
export var and = operator<boolean,boolean>('&&');
export var or = operator<boolean,boolean>('||');

export var not = prefixOperator<boolean,boolean>('!');
export var increment = prefixOperator<number,number>('++');
export var decrement = prefixOperator<number,number>('--');

export var toInt = suffixOperator<number,number>('| 0');

export var result = named<any>('data');
export var current = named<any>('x');
export var index = named<number>('i');
export var arrayIndex = named<number>('arrayIndex');
export var length:CodeText<number> = named<number>('length');
export var cont:CodeText<void> = ['continue;'];
export var br:CodeText<void> = ['break;'];
export var undef:CodeText<void> = ['void 0'];
export var nullValue:CodeText<void> = ['null'];
export var infinity:CodeText<number> = ['Infinity'];
export var negativeInfinity:CodeText<number> = ['-Infinity'];
export var trueValue:CodeText<boolean> = ['true'];
export var falseValue:CodeText<boolean> = ['false'];
export var empty:CodeText<void> = [];

export var itarMapBefore = named('itarMapBefore');
export var itarMapAfter = named('itarMapAfter');

export var hasOwnProperty = Object.prototype.hasOwnProperty;

export function paramName(index:number) {
    return '_p' + index;
}

export function codeTextToString(text:CodeText<any>, params:any[]):string {
    var result = '';
    for (var j = 0; j < text.length; j++) {
        var fragment = text[j];
        if (typeof fragment === 'string') {
            result += fragment;
        } else {
            var param = fragment[0];
            var paramIndex = params.indexOf(param);
            var newParamIndex = paramIndex === -1 ? params.length : paramIndex;
            result += paramName(newParamIndex);
            if (paramIndex === -1) {
                params.push(param);
            }
        }
    }
    return result;
}

export function getParamNames(params:any[]):string {
    var paramNames = [];
    for (let i = 0; i < params.length; i++) {
        paramNames.push(paramName(i));
    }
    return paramNames.join(',');
}

export function assign<T>(lhs:CodeText<T>, rhs:CodeText<T>, expression?:boolean):CodeText<void> {
    var result = [...lhs, '=', ...rhs];
    if (!expression) {
        result.push(';');
    }
    return result;
}

export function named<T>(name:string):CodeText<T> {
    return [name];
}

export function literal<T extends string|number>(value:T):CodeText<T> {
    if (value as any === Infinity) {
        return infinity as any;
    }
    return [JSON.stringify(value)];
}

export function callParam<T>(fn:(...args)=>T, context:any, params?:CodeText<any>[]):CodeText<T> {
    var contextCodeText:CodeText<any> = context == null ? null : param(context);

    var usedParams:CodeText<any>[] = getUsedParams(fn, params ? params : [current, index]);

    return call(param(fn), usedParams, contextCodeText);
}

export function call<T>(fn:CodeText<(...args)=>T>, params?:CodeText<any>[], context?:CodeText<any>):CodeText<T> {
    var call:string;
    if (context) {
        call = '.call';
        params = params ? [context].concat(params) : [context];
    } else {
        call = '';
    }

    return [...fn, call + '(', ...comma.apply(null, params), ')'];
}

function getUsedParams(fn:Function, params:CodeText<any>[]):CodeText<any>[] {
    if (fn.length < params.length && Function.prototype.toString.call(fn).indexOf('arguments') === -1) {
        return params.slice(0, fn.length);
    }
    return params;
}

export function conditional(condition:CodeText<boolean>, statement:CodeText<any>, elseStatement?:CodeText<any>):CodeText<void> {
    var elseBranch = elseStatement ? ['else{', ...elseStatement, '}'] : empty;
    return ['if(', ...condition, '){', ...statement, '}', ...elseBranch];
}

export function param<T>(param:T):CodeText<T> {
    if (typeof param === 'string' || typeof param === 'number' || typeof param === 'boolean' || param === null) {
        return [JSON.stringify(param)];
    } else if (param === void 0) {
        return undef as any;
    }
    return [[param]];
}

export function params<T>(params:T[]):CodeText<T>[] {
    var result:CodeText<T>[] = [];
    for (var i = 0; i < params.length; i++) {
        result.push(param(params[i]));
    }
    return result;
}

export function seq(texts:CodeText<any>[]):CodeText<void> {
    var result:CodeText<void> = [];
    for (var i = 0; i < texts.length; i++) {
        var text = texts[i];
        push.apply(result, text);
    }
    return result;
}

export function retSeq<T>(texts:CodeText<any|Ret<T>>[]):CodeText<Ret<T>> {
    return seq(texts) as CodeText<any>;
}

export function array<T>(...values:CodeText<T>[]):CodeText<Array<T>> {
    if (arguments.length === 0) {
        return ['[]'];
    }
    var result:CodeText<Array<T>> = ['['];
    for (var i = 0; i < values.length; i++) {
        var value = values[i];
        push.apply(result, value);
        if (i < values.length - 1) {
            result.push(',');
        }
    }
    result.push(']');
    return result;
}

export function newArray(length:CodeText<number>) {
    return ['new Array(', ...length, ')'];
}

export function obj():CodeText<{}> {
    return ['{}'];
}

type Indexable<T> = {[index:string]:T}|{[index:number]:T};

export function prop<T>(object:CodeText<Indexable<T>>, property:string|number|CodeText<string|number>):CodeText<T> {
    if (typeof property === 'object') {
        return [...object, '[', ...property, ']'];
    }
    if (/^[a-zA-Z$_][a-zA-Z$_0-9]*$/.test(property + '')) {
        return [...object, '.' + property];
    } else {
        return [...object, '[', JSON.stringify(property), ']'];
    }
}

export function ternary<T>(condition:CodeText<boolean>, trueExpr:CodeText<T>, falseExpr:CodeText<T>):CodeText<T> {
    return [...condition, '?', ...trueExpr, ':', ...falseExpr];
}

export function declare<T>(variable:CodeText<T>, initial?:CodeText<T>):CodeText<void> {
    if (!initial) {
        return [`var ${variable[0]};`];
    }
    return [`var ${variable[0]}=`, ...initial, ';'];
}

export function setResult(value:CodeText<any>):CodeText<void> {
    return assign(result, value);
}

export function func<T>(params:string[], text:CodeText<Ret<T>>):CodeText<T> {
    return ['function(' + params.join(',') + '){', ...text, '}'];
}

export function ret<T>(code:CodeText<T>):CodeText<Ret<T>> {
    return ['return ', ...code, ';'];
}

export function access(fn:Accessible<any,any>, context?:any, variable?:CodeText<any>):CodeText<any> {
    var customVariable:boolean = !!variable;
    variable = variable || current;
    if (typeof fn === 'function') {
        return callParam(fn, context, customVariable ? [variable] : [variable, index]);
    } else if (typeof fn === 'string') {
        return prop(variable, fn);
    }
    return variable;
}

export function cast<T>(text:CodeText<any>):CodeText<T> {
    return text;
}

export function type(text:CodeText<any>):CodeText<string> {
    return ['typeof ', ...text];
}

export function toStr(text:CodeText<any>):CodeText<string> {
    return add(text, cast<number>(literal(''))) as any;
}

export function toNum(text:CodeText<any>):CodeText<string> {
    return ['+', ...text];
}

export function comma(...expressions:CodeText<any>[]) {
    var result:CodeText<any> = [];
    for (var i = 0; i < expressions.length; i++) {
        push.apply(result, expressions[i]);
        if (i < expressions.length - 1) {
            result.push(',');
        }
    }
    return result;
}

export function isObjectType(typeVar:CodeText<string>):CodeText<boolean> {
    return or(eq(typeVar, literal('function')), and(eq(typeVar, literal('object')), neq(result, literal(null))));
}

export function isObjectConditional(collectionType:CollectionType, object:CodeText<any>, statement:CodeText<any>, elseStatement:CodeText<any>):CodeText<void> {
    var typeVar = named<string>('type');
    if (collectionType !== CollectionType.UNKNOWN) {
        return statement;
    }
    return seq([
        declare(typeVar, type(object)),
        conditional(
            isObjectType(typeVar),
            statement,
            elseStatement
        )
    ]);
}

interface ItarOpts {
    reversed?:boolean;
    ranges?:LoopRange[];
    level?:number;
}

function compatible(lastRange:LoopRange, range:LoopRange):boolean {
    if (!lastRange) {
        return false;
    }
    return lastRange.definesStart === range.definesStart && lastRange.relativeToStart === range.relativeToStart;
}

function put(lastRange:LoopRange, range:LoopRange) {
    if (lastRange.definesStart === lastRange.relativeToStart) { //rest or initial
        lastRange.value += range.value;
    } else { //first or last
        if (range.value < lastRange.value) {
            lastRange.value = range.value;
        }
    }
}

function mergeRanges(ranges:LoopRange[]) {
    var result:LoopRange[] = [];

    for (var i = 0; i < ranges.length; i++) {
        var range:LoopRange = ranges[i];
        var lastRange = result[result.length - 1];
        if (compatible(lastRange, range)) {
            put(lastRange, range);
        } else {
            result.push(range);
        }
    }

    return result;
}

export function iterSimple(end:CodeText<number>, block:CodeText<any>, level?:number):CodeText<void> {
    var loopIndex = index;
    if (typeof level === 'number') {
        loopIndex = rename(index, level);
    }
    return iter(declare(loopIndex, literal(0)), lt(loopIndex, end), increment(loopIndex), block);
}

export function iter(declaration:CodeText<any>, condition:CodeText<boolean>, afterthought:CodeText<any>, block:CodeText<any>):CodeText<void> {
    return ['for(', ...seq([
        declaration,
        statement(condition),
        afterthought
    ]), '){\n', ...block, '\n}'];
}

export function itar(init:CodeText<any>, array:CodeText<any[]>, block:CodeText<any>, opts:ItarOpts):CodeText<void> {
    var initial:CodeText<number>;
    var condition:CodeText<boolean>;
    var afterthought:CodeText<any>;
    var loopIndex = index;
    var loopLength = length;
    var ranges:LoopRange[] = mergeRanges(opts.ranges || []);
    var start = named<number>('start');

    if (typeof opts.level === 'number') {
        loopIndex = rename(index, opts.level);
        loopLength = rename(length, opts.level);
    }

    var declarations:CodeText<any>[] = [];
    var startConstant = 0;
    for (var i = 0; i < ranges.length; i++) {
        var range:LoopRange = ranges[i];
        var value = range.value;
        if (range.definesStart) {
            if (range.relativeToStart) { //rest
                if (startConstant === null) {
                    declarations.push(assign(start, add(start, literal(value))));
                } else {
                    startConstant = value;
                }
            } else { //last
                if (startConstant !== null) {
                    declarations.push(declare(start, literal(startConstant)));
                }
                var newStart = subtract(loopLength, literal(value));
                declarations.push(conditional(
                    gt(newStart, startConstant === null ? start : literal(startConstant)),
                    assign(start, newStart)
                ));
                startConstant = null;
            }


        } else {
            if (range.relativeToStart) {//first
                let endLiteral = literal(value);
                declarations.push(conditional(
                    gt(loopLength, endLiteral),
                    assign(loopLength, endLiteral)
                ));
            } else { //initial
                let endLiteral = literal(value);
                declarations.push(assign(loopLength, ternary(
                    gt(loopLength, endLiteral),
                    subtract(loopLength, endLiteral),
                    literal(0)
                )));
            }
        }
    }

    var startCodeText:CodeText<number> = startConstant === null ? start : literal(startConstant);

    if (opts.reversed) {
        initial = subtract(loopLength, add(literal(1), startCodeText));
        condition = gte(loopIndex, literal(0));
        afterthought = decrement(loopIndex);
    } else {
        initial = startCodeText;
        condition = lt(loopIndex, loopLength);
        afterthought = increment(loopIndex);
    }

    var loop = iter(
        declare(loopIndex, initial),
        condition,
        afterthought,
        ensureCurrentInitialized(array, substituteItarMapAfter(block, startCodeText), opts.level)
    );

    return seq([
        declare(loopLength, prop<number>(array, 'length')),
        seq(declarations),
        substituteItarMapBefore(init, startCodeText, loopLength),
        loop
    ]);
}

function substituteItarMapBefore(codeText:CodeText<any>, startCodeText:CodeText<number>, loopLength:CodeText<number>):CodeText<void> {
    var size:CodeText<number> = isZero(startCodeText) ? loopLength : ternary(
        gt(loopLength, startCodeText),
        subtract(loopLength, startCodeText),
        literal(0)
    );
    return substitute(codeText, itarMapBefore[0] as string, setResult(newArray(size)));
}

function isZero(codeText:CodeText<number>) {
    return isNumberLiteral(codeText, 0);
}

function isNumberLiteral(codeText:CodeText<number>, literal:number) {
    return codeText.length === 1 && codeText[0] === literal + '';
}

function substituteItarMapAfter(codeText:CodeText<any>, startCodeText:CodeText<number>):CodeText<void> {
    var newAfter = assign(prop(result, subtract(index, startCodeText)), current);
    return substitute(codeText, itarMapAfter[0] as string, newAfter);
}

function substitute(codeText:CodeText<any>, find:string, replace:CodeText<any>) {
    var resultCodeText:CodeText<void> = [];

    for (var i = 0; i < codeText.length; i++) {
        var fragment = codeText[i];
        if (fragment === find) {
            push.apply(resultCodeText, replace);
        } else {
            resultCodeText.push(fragment);
        }
    }

    return resultCodeText;
}

export function itin(object:CodeText<{[index:string]:any}>, block:CodeText<any>, includeParent?:boolean):CodeText<void> {
    block = ensureCurrentInitialized(object, block);
    if (!includeParent) {
        block = conditional(
            call(param(hasOwnProperty), [index], object),
            block
        );
    }

    return ['for(var ', ...index, ' in ', ...object, '){\n', ...block, '\n}'];
}

function ensureCurrentInitialized(collection:CodeText<any>, codeText:CodeText<any>, level?:number):CodeText<any> {
    if (typeof level !== 'number' && usesCurrent(codeText)) {
        var initial:CodeText<any> = null;
        if (!initialValueIsUnused(codeText, current)) {
            initial = prop(collection, index);
        }

        return seq([declare(current, initial), codeText]);
    }
    return codeText;
}

export function statement(text:CodeText<any>, br?:boolean):CodeText<void> {
    return [...text, ';' + (br ? '\n' : '')];
}

export function par<T>(text:CodeText<T>):CodeText<T> {
    return ['(', ...text, ')'];
}

export function isIn<T>(property:CodeText<string>, text:CodeText<T>):CodeText<T> {
    return [...property, ' in ', ...text];
}

export function rename(orig:CodeText<any>, level:number) {
    return named<number>(orig[0] + '' + level);
}


function usesCurrent(text:CodeText<any>):boolean {
    return codeTextContains(text, current);
}

function initialValueIsUnused(text:CodeText<any>, variable:CodeText<any>) {
    var name = variable[0];
    for (var i = 0; i < text.length; i++) {
        var fragment = text[i];
        if (fragment === 'if(' || fragment === '?') { //we cannot be sure that the variable is unused in all branches
            return false;
        }
        if (fragment === name) {
            if (text[i + 1] === '=') {
                for (var j = i + 2; j < text.length; j++) {
                    var fr = text[j];
                    if (fr === name) {
                        return false;
                    }
                    if (fr === ';') {
                        return true;
                    }
                }
            } else {
                return false;
            }
        }
    }
}

export function codeTextContains(text:CodeText<any>, part:CodeText<any>):boolean {
    var name = part[0];
    for (var i = 0; i < text.length; i++) {
        var fragment = text[i];
        if (fragment === name) {
            return true;
        }
    }
    return false;
}

export function codeTextEquals(text1:CodeText<any>, text2:CodeText<any>):boolean {
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
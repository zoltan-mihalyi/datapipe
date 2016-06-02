var push = Array.prototype.push;

export type Operator<P,R> = (a:CodeText<P>, b:CodeText<P>) => CodeText<R>;

function operator<P,R>(op:string):Operator<P,R> {
    return function (a:CodeText<P>, b:CodeText<P>):CodeText<R> {
        return [...a, op, ...b];
    };
}

function prefixOperator<I,O>(prefix):(text:CodeText<I>)=>CodeText<O> {
    return function (text:CodeText<I>):CodeText<O> {
        return [prefix, ...text];
    };
}

export var eql = operator<any,boolean>('==');
export var eq = operator<any,boolean>('===');
export var neq = operator<any,boolean>('!==');
export var lt = operator<number,boolean>('<');
export var gt = operator<number, boolean>('>');
export var gte = operator<number, boolean>('>=');
export var minus = operator<number,number>('-');
export var and = operator<boolean,boolean>('&&');

export var not = prefixOperator<boolean,boolean>('!');
export var increment = prefixOperator<number,number>('++');


export var result = named<any>('data');
export var current = named<any>('x');
export var index = named<number>('i');
export var cont:CodeText<void> = ['continue;'];
export var br:CodeText<void> = ['break;'];
export var undef:CodeText<void> = ['void 0'];
export var nullValue:CodeText<void> = ['null'];
export var infinity:CodeText<number> = ['Infinity'];
export var negativeInfinity:CodeText<number> = ['-Infinity'];
export var trueValue:CodeText<boolean> = ['true'];
export var falseValue:CodeText<boolean> = ['false'];
export var empty:CodeText<void> = [];

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

export function assign<T>(lhs:CodeText<T>, rhs:CodeText<T>):CodeText<void> {
    return [...lhs, '=', ...rhs, ';'];
}

export function named<T>(name:string):CodeText<T> {
    return [name];
}

export function literal<T extends string|number>(value:T):CodeText<T> {
    return [JSON.stringify(value)];
}

export function callParam<T>(fn:()=>T, context:any, params?:CodeText<any>[]):CodeText<T> {
    var contextCodeText:CodeText<any> = context == null ? null : param(context);
    return call(param(fn), params ? params : [current], contextCodeText);
}

export function call<T>(fn:CodeText<()=>T>, params?:CodeText<any>[], context?:CodeText<any>):CodeText<T> {
    var call:string;
    if (context) {
        call = '.call';
        params = [context].concat(params);
    } else {
        call = '';
    }

    var result:CodeText<T> = [...fn, call + '('];
    if (params) {
        for (var i = 0; i < params.length; i++) {
            push.apply(result, params[i]);
            if (i < params.length - 1) {
                result.push(',');
            }
        }
    }
    result.push(')');

    return result;
}

export function conditional(condition:CodeText<boolean>, statement:CodeText<any>, elseStatement?:CodeText<any>):CodeText<void> {
    var elseBranch = elseStatement ? ['else{', ...elseStatement, '}'] : empty;
    return ['if(', ...condition, '){', ...statement, '}', ...elseBranch];
}

export function param<T>(param:T):CodeText<T> {
    if (typeof param === 'string' || typeof param === 'number') {
        return [JSON.stringify(param)];
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
    if (values.length === 0) {
        return ['[]'];
    }
    var result:CodeText<Array<T>> = ['['];
    for (var i = 0; i < values.length; i++) {
        var code = values[i];
        push.apply(result, code);
        if (i < values.length - 1) {
            result.push(',');
        }
    }
    result.push(']');
    return result;
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

export function declare<T>(variable:CodeText<T>, initial:CodeText<T>):CodeText<void> {
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

export function access(fn:string|(()=>any), context?:any, variable?:CodeText<any>):CodeText<any> {
    variable = variable || current;
    if (typeof fn === 'function') {
        return callParam(fn, context, [variable]);
    } else {
        return prop(variable, fn);
    }
}

export function cast<T>(text:CodeText<any>):CodeText<T> {
    return text;
}

export function type(text:CodeText<any>, type:string):CodeText<boolean> {
    return ['typeof ', ...eq(text, literal(type))];
}

export function itar(array:CodeText<any[]>, block:CodeText<any>):CodeText<void> {
    return ['for(', ...seq([
        declare(index, literal(0)),
        statement(lt(index, prop<number>(array, 'length'))),
        increment(index)
    ]), '){\n', ...block, '\n}'];
}

export function itin(array:CodeText<{[index:string]:any}>, block:CodeText<any>):CodeText<void> {
    return ['for(var ', ...index, ' in ', ...array, '){\n', ...block, '\n}'];
}

export function statement(text:CodeText<any>, br?:boolean):CodeText<void> {
    return [...text, ';' + (br ? '\n' : '')];
}
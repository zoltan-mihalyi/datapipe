var push = Array.prototype.push;

//todo generic CodeText?

export function paramName(index:number) {
    return '_p' + index;
}

export function codeTextToString(text:CodeText<any>, params:any[]):string {
    var result = '';
    for (var j = 0; j < text.length; j++) {
        if (typeof text[j] === 'string') {
            result += text[j];
        } else {
            result += paramName(params.length);
            params.push(text[j][0]);
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

export function conditional(condition:CodeText<boolean>, statement:CodeText<any>):CodeText<void> {
    return ['if(', ...condition, '){', ...statement, '}'];
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

export function seq<T>(texts:Array<CodeText<any>|CodeText<Ret<T>>>):CodeText<Ret<T>> {
    var result:CodeText<Ret<T>> = [];
    for (var i = 0; i < texts.length; i++) {
        var text = texts[i];
        push.apply(result, text);
        if (i < texts.length - 1 && result[result.length - 1] !== ';') {
            result.push(';');
        }
    }
    return result;
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

export function prop<T>(object:CodeText<{[index:string]:T}|{[index:number]:T}>, property:string|number|CodeText<string|number>):CodeText<T> {
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
    return [`var ${variable[0]}=`, ...initial]
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

export function access(fn:string|Function, variable?:string):CodeText<any> {
    variable = variable || 'x';
    if (typeof fn === 'function') {
        return accessFunction([[fn]], null, [[variable]]);
    } else {
        return prop(named<{[idx:string]:any}>(variable), fn);
    }
}

export function cast<T>(text:CodeText<any>):CodeText<T> {
    return text;
}

function accessFunction<T>(fn:CodeText<()=>T>, context:CodeText<any>, params:CodeText<any>[]):CodeText<T> { //todo remove
    var call:string;
    if (context) {
        call = '.call';
        params = [context].concat(params);
    } else {
        call = '';
    }

    var result:CodeText<T> = [...fn, call + '('];
    for (var i = 0; i < params.length; i++) {
        push.apply(result, params[i]);
        if (i < params.length - 1) {
            result.push(',');
        }
    }
    result.push(')');

    return result;
}

function operator<P,R>(op:string):(a:CodeText<P>, b:CodeText<P>)=>CodeText<R> {
    return function (a:CodeText<P>, b:CodeText<P>):CodeText<R> {
        return [...a, op, ...b];
    };
}

function prefixOperator<I,O>(prefix) {
    return function (text:CodeText<I>):CodeText<O> {
        return [prefix, ...text];
    }
}

export var eql = operator<any,boolean>('==');
export var neq = operator<any,boolean>('!==');
export var lt = operator<number,boolean>('<');
export var gt = operator<number, boolean>('>');
export var minus = operator<number,number>('-');

export var not = prefixOperator<boolean,boolean>('!');
export var increment = prefixOperator<number,number>('++');

export var result = named<any>('data');
export var current = named<any>('x');
export var count = named<number>('count');
export var cont:CodeText<void> = ['continue;'];
export var br:CodeText<void> = ['break;'];
export var undef:CodeText<void> = ['void 0'];
export var nullValue:CodeText<void> = ['null'];
export var infinity:CodeText<number> = ['Infinity'];
export var negativeInfinity:CodeText<number> = ['-Infinity'];
export var trueValue:CodeText<boolean> = ['true'];
export var falseValue:CodeText<boolean> = ['false'];
export var empty:CodeText<void> = [];
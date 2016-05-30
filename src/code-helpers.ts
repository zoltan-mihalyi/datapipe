var push = Array.prototype.push;

//todo generic CodeText?

export function paramName(index:number) {
    return '_p' + index;
}

export function codeTextToString(text:CodeText, params:any[]):string {
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

export function assign(lhs:CodeText, rhs:CodeText):CodeText {
    return [...lhs, '=', ...rhs];
}

export function named(name:string):CodeText {
    return [name];
}

export function call(fn:CodeText, params?:CodeText[], context?:CodeText) {
    var call:string;
    if (context) {
        call = '.call';
        params = [context].concat(params);
    } else {
        call = '';
    }

    var result:CodeText = [...fn, call + '('];
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

export function conditional(condition:CodeText, statement:CodeText):CodeText {
    return ['if(', ...condition, '){', ...statement, '}'];
}

export function not(condition:CodeText) {
    return ['!', ...condition];
}

export function param(param:any):CodeText {
    if (typeof param === 'string' || typeof param === 'number') {
        return [JSON.stringify(param)];
    }
    return [[param]];
}

export function params(params:any[]):CodeText[] {
    var result:CodeText[] = [];
    for (var i = 0; i < params.length; i++) {
        result.push(param(params[i]));
    }
    return result;
}

export function seq(texts:CodeText[]):CodeText {
    var result:CodeText = [];
    for (var i = 0; i < texts.length; i++) {
        var text = texts[i];
        push.apply(result, text);
        if (i < texts.length - 1) {
            result.push(';\n');
        }
    }
    return result;
}

export function array(...values:CodeText[]):CodeText {
    if (values.length === 0) {
        return ['[]'];
    }
    var result:CodeText = ['['];
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

export function obj():CodeText {
    return ['{}'];
}

export function prop(object:CodeText, property:string|number|CodeText):CodeText {
    if (typeof property === 'object') {
        return [...object, '[', ...property, ']'];
    }
    if (/^[a-zA-Z$_][a-zA-Z$_0-9]*$/.test(property + '')) {
        return [...object, '.' + property];
    } else {
        return [...object, '[', JSON.stringify(property), ']'];
    }
}

export function ternary(condition:CodeText, trueExpr:CodeText, falseExpr:CodeText):CodeText {
    return [...condition, '?', ...trueExpr, ':', ...falseExpr];
}

export function declare(variable:string, initial:CodeText) {
    return [`var ${variable}=`, ...initial]
}

export function setResult(value:CodeText) {
    return assign(result, value);
}

export function func(params:string[], text:CodeText):CodeText {
    return ['function(' + params.join(',') + '){', ...text, '}'];
}

export function ret(code:CodeText) {
    return ['return ', ...code, ';'];
}

export function access(fn:string|Function, variable?:string):CodeText {
    variable = variable || 'x';
    if (typeof fn === 'function') {
        return accessFunction([[fn]], null, [[variable]]);
    } else {
        return [accessProperty(fn, variable)];
    }
}

function accessProperty(property:string|number, variable?:string):string {
    variable = variable || 'x';
    return `${variable}[${JSON.stringify(property)}]`;
}

function accessFunction(fn:CodeText, context:CodeText, params:CodeText[]):CodeText {
    var call:string;
    if (context) {
        call = '.call';
        params = [context].concat(params);
    } else {
        call = '';
    }

    var result:CodeText = [...fn, call + '('];
    for (var i = 0; i < params.length; i++) {
        push.apply(result, params[i]);
        if (i < params.length - 1) {
            result.push(',');
        }
    }
    result.push(')');

    return result;
}

function operator(op:string) {
    return function (a:CodeText, b:CodeText) {
        return [...a, op, ...b]
    };
}

export var eql = operator('==');
export var neq = operator('!==');
export var lt = operator('<');
export var gt = operator('>');
export var minus = operator('-');

export var result = named('data');
export var current = named('x');
export var count = named('count');
export var cont:CodeText = ['continue;'];
export var br:CodeText = ['break;'];
export var undef:CodeText = ['void 0'];
export var nullValue:CodeText = ['null'];
export var infinity:CodeText = ['Infinity'];
export var trueValue:CodeText = ['true'];
export var falseValue:CodeText = ['false'];
export var negativeInfinity:CodeText = ['-Infinity'];
export var empty:CodeText = [];
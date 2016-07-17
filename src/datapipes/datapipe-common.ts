import {CollectionType} from "../common";
import {
    hasOwnProperty,
    neq,
    prop,
    current,
    param,
    or,
    conditional,
    falseValue,
    ret,
    not,
    par,
    isIn,
    literal,
    eql,
    trueValue,
    codeTextToString,
    func,
    retSeq,
    getParamNames,
    itarMapBefore,
    itarMapAfter,
    setResult,
    array,
    result,
    call
} from "../code-helpers";

export const enum ResultCreation {
    NEW_OBJECT, USES_PREVIOUS, EXISTING_OBJECT
}

export interface Step {
    code:DynamicCode;
    parentType:CollectionType;
    needsProvider:NeedsProvider;
}

export interface DataPipeResult<R,T> {
    process(data:R[]):T;
    compile():DataPipeResult<R,T>;
}

type Primitive = string|number|boolean|void;

export type Provider<T> = {():T}|Primitive&T;


export const filterMapBefore = setResult(array());
export const filterMapAfter = call(prop<()=>any>(result, 'push'), [current]);

export const NEEDS_SAME:NeedsProvider = (needs:Needs)=> {
    return needs;
};

export const isArray = Array.isArray;

export function whereFilter(properties:Properties):IterateeFunction<any,boolean> {
    var statements:CodeText<void|Ret<boolean>>[] = [];
    if (typeof properties !== 'string') {
        for (let i in properties) {
            if (hasOwnProperty.call(properties, i)) {
                var condition = neq(
                    prop(current, i),
                    param(properties[i])
                );
                if (properties[i] === void 0) {
                    condition = or(condition, not(par(isIn(literal(i), current))))
                }
                statements.push(conditional(
                    condition,
                    ret(falseValue)
                ));
            }
        }
    }
    if (statements.length > 0) {
        statements.unshift(conditional(
            eql(current, literal(null)),
            ret(falseValue)
        ));
    }
    statements.push(ret(trueValue));

    var params = [];
    var fn:string = codeTextToString(ret(func(['x'], retSeq(statements))), params);
    return (new Function(getParamNames(params), fn)).apply(null, params);
}

export function toAccessible<T,R>(iteratee?:Iteratee<T,R>):Accessible<T,R> {
    if (typeof iteratee === 'string' || typeof iteratee === 'number' || iteratee == null || typeof  iteratee === 'function') {
        return iteratee as any;
    } else {
        return whereFilter(iteratee as Properties);
    }
}

export function optimizeMap(loop:Loop, ctx:Context):void { //todo auto
    if (!ctx.loop || (!ctx.loop.lengthDirty && ctx.array)) {
        loop.before = itarMapBefore;
        loop.after = itarMapAfter;
    }
}

export function flattenTo(array, result) {
    var length = array.length;
    for (var i = 0; i < length; ++i) {
        var obj = array[i];
        if (obj && isArray(obj)) {
            flattenTo(obj, result);
        } else {
            result.push(obj);
        }
    }
    return result;
}
import {call, prop, setResult, array, result, current, newArray, index, assign, length} from "./code-helpers";

export const enum CollectionType {
    ARRAY, MAP, UNKNOWN
}

export var filterMapBefore = setResult(array());
export var filterMapAfter = call(prop<()=>any>(result, 'push'), [current]);

export var mapBefore:CodeText<void> = setResult(newArray(length));
export var mapAfter:CodeText<void> = assign(prop(result, index), current);

export function isProvider(code:DynamicCode):code is CodeProvider {
    return typeof (code as CodeProvider).createCode === 'function';
}
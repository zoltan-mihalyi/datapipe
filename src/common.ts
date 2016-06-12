import {call, prop, setResult, array, result, current, newArray, index, assign} from "./code-helpers";

export enum CollectionType {
    ARRAY, MAP, UNKNOWN
}

export var filterMapBefore = setResult(array());
export var filterMapAfter = call(prop<()=>any>(result, 'push'), [current]);

export var mapBefore:CodeText<void> = setResult(newArray(prop<number>(result, 'length')));
export var mapAfter:CodeText<void> = assign(prop(result, index), current);
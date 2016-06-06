import {call, prop, setResult, array, result, current} from "./code-helpers";

export enum CollectionType {
    ARRAY, MAP, UNKNOWN
}

export var filterMapBefore = setResult(array());
export var filterMapAfter = call(prop<()=>any>(result, 'push'), [current]);
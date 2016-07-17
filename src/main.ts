import {CollectionType} from "./common";
import RootDataPipe = require("./datapipes/root-datapipe");

export = <T>(typeName?:string) => {
    var type:CollectionType;
    if (typeName === 'array') {
        type = CollectionType.ARRAY;
    } else if (typeName === 'object' || typeName === 'map') {
        type = CollectionType.MAP;
    } else {
        type = CollectionType.UNKNOWN;
    }
    return new RootDataPipe<any>(type);
};
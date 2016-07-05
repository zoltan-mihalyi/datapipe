import {CollectionType} from "./common";
import DataPipe = require("./datapipe");
import RootDataPipe = require("./root-datapipe");
import ChildDataPipe = require("./child-datapipe");
DataPipe.ChildDataPipe = ChildDataPipe;

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
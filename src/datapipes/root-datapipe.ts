///<reference path="../interfaces.ts"/>
import DataPipe = require('./datapipe');
import {Step} from "./datapipe-common";
import ChildDataPipe = require("./child-datapipe");

class RootDataPipe<T> extends DataPipe<T,T> {
    process(data:T[]):T[] {
        return data;
    }

    compile():RootDataPipe<T> {
        return this;
    }

    fn():Mapper<T,T> {
        return this.process;
    }

    getSteps():Step[] {
        return [];
    }

    hasNewResult():boolean {
        return false;
    }

    newChild<R,T>(type, parent, code, rc, np):ChildDataPipe<R,T> {
        return new ChildDataPipe<R,T>(type, parent, code, rc, np);
    }
}
export = RootDataPipe;
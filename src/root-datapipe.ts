///<reference path="interfaces.ts"/>
import DataPipe = require('./datapipe');
import {Step} from "./common";

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
}
export = RootDataPipe;
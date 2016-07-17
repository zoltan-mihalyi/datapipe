import ArraysDataPipe = require("./methods/arrays-datapipe");
abstract class DataPipe<R,T> extends ArraysDataPipe<R,T> {
    asDataPipe():DataPipe<R,T> {
        return this;
    }
}

export = DataPipe;
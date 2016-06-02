interface ArrayT<T,E> extends Array<E> {
    noSuchItem?:T; //only for type checks
}

type CodeText<T> = ArrayT<T,string|{0:any}>;

interface Loop {
    before?:CodeText<any>;
    after?:CodeText<any>;
    text:CodeText<any>;
    mergeStart:boolean;
    mergeEnd:boolean;
    reversed?:boolean;
    rename?:boolean;
    changesIndex?:boolean;
}

interface Ret<T> {
}

type Code = Loop | CodeText<any>;
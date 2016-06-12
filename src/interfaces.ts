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
    changesLength:boolean;
    reversed?:boolean;
    rename?:boolean;
}

interface Ret<T> {
}

interface Context {
    loop?:{
        lengthDirty:boolean;
        array:boolean;
    };
}

type Code = Loop | CodeText<any>;

type CodeProvider = {
    createCode:(ctx:Context)=>Code;
};

type DynamicCode = Code|CodeProvider;
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
    until?:number;
    from?:number;
}

interface Ret<T> {
}

interface Context {
    loop?:{
        lengthDirty:boolean;
        from:number
    };
    array:boolean;
}

interface Needs {
    size?:boolean;
    range?:{
        start:number;
        length:number
    }
}

type NeedsProvider = (need?:Needs) => Needs;

type Code = Loop | CodeText<any>;

type CodeProvider = {
    createCode:(ctx:Context, needs:Needs) => Code;
    handlesSize:boolean;
};

type DynamicCode = Code|CodeProvider;
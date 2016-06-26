interface ArrayT<T,E> extends Array<E> {
    noSuchItem?:T; //only for type checks
}

type CodeText<T> = ArrayT<T,string|{0:any}>;

interface LoopRange {
    endFromStart?:number;
    startFromStart?:number;
    endFromEnd?:number;
}

interface Loop extends LoopRange {
    before?:CodeText<any>;
    after?:CodeText<any>;
    text:CodeText<any>;
    mergeStart:boolean;
    mergeEnd:boolean;
    reversed?:boolean;
    rename?:boolean;
}

interface Ret<T> {
}

interface Context {
    loop?:{
        lengthDirty:boolean;
        range?:LoopRange;
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

interface CodeBlock {
    getContext():Context;
    put(code:Code):void;
    canPut(code:Code):boolean;
    getCodeText():CodeText<any>;
}

type NeedsProvider = (need?:Needs) => Needs;

type Code = Loop | CodeText<any>;

type CodeProvider = {
    createCode:(ctx:Context, needs:Needs) => Code;
    handlesSize:boolean;
};

type DynamicCode = Code|CodeProvider;
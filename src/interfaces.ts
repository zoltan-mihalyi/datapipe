interface ArrayT<T,E> extends Array<E> {
    noSuchItem?:T; //only for type checks
}

type CodeText<T> = ArrayT<T,string|{0:any}>;

interface LoopRange {
    definesStart:boolean;
    relativeToStart:boolean;
    value:number;
}

interface Loop {
    before?:CodeText<any>;
    after?:CodeText<any>;
    text:CodeText<any>;
    mergeStart:boolean;
    mergeEnd:boolean;
    reversed?:boolean;
    rename?:boolean;
    range?:LoopRange;
    includeParent?:boolean;
}

interface Ret<T> {
}

interface Context {
    loop?:{
        lengthDirty:boolean;
    };
    array:boolean;
}

interface Needs {
    size?:boolean;
    range?:{
        start:number;
        length:number
    };
}

interface CodeBlock {
    getContext():Context;
    put(code:Code):void;
    canPut(code:Code):boolean;
    getCodeText():CodeText<any>;
}

type IterateeFunction<T,R> = (t?:T) => R;
type Properties = {[index:string]:any};
type Iteratee<T,R> =  string|number|IterateeFunction<T,R>|Properties;
type Predicate<T> =  Iteratee<T,boolean>;
type Accessible<T,R> = string|number|IterateeFunction<T,R|boolean>

type NeedsProvider = (need?:Needs) => Needs;

type Code = Loop | CodeText<any>;

type CodeProvider = {
    createCode:(ctx:Context, needs:Needs) => Code;
    primitiveCode?:CodeText<any>;
    handlesSize:boolean;
};

type DynamicCode = Code|CodeProvider;

type Mapper<I,O> = (data:I[])=>O[];
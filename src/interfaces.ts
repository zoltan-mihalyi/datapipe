type CodeText = Array<string|{0:any}>;

interface Loop {
    before?:CodeText;
    after?:CodeText;
    text:CodeText;
    mergeStart:boolean;
    mergeEnd:boolean;
    reversed?:boolean;
    rename?:boolean;
    usesCount?:boolean;
    changesCount?:boolean;
}

type Code = Loop | CodeText;
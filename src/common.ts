export const enum CollectionType {
    ARRAY, MAP, UNKNOWN
}

export const enum ResultCreation {
    NEW_OBJECT, USES_PREVIOUS, EXISTING_OBJECT
}

export function isProvider(code:DynamicCode):code is CodeProvider {
    return typeof (code as CodeProvider).createCode === 'function';
}

export interface Step {
    code:DynamicCode;
    parentType:CollectionType;
    needsProvider:NeedsProvider;
}
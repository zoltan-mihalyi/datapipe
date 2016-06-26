export const enum CollectionType {
    ARRAY, MAP, UNKNOWN
}

export function isProvider(code:DynamicCode):code is CodeProvider {
    return typeof (code as CodeProvider).createCode === 'function';
}
import CollectionsDataPipe = require("./collections-datapipe");
import {CollectionType} from "../../common";
import {
    result,
    prop,
    literal,
    setResult,
    undef,
    empty,
    seq,
    current,
    conditional,
    param,
    cont,
    index,
    callParam,
    and,
    assign,
    call,
    array,
    neq,
    access,
    obj,
    statement,
    isObjectConditional,
    hasOwnProperty,
    itarMapBefore,
    itarMapAfter,
    type,
    eq,
    br,
    named,
    not,
    itin,
    declare,
    neql,
    nullValue,
    or,
    toStr,
    par,
    toNum,
    divide,
    comma,
    trueValue,
    falseValue,
    isObjectType
} from "../../code-helpers";
import {ResultCreation, toAccessible, DataPipeResult, whereFilter, flattenTo, isArray} from "../datapipe-common";
import DataPipe = require("../datapipe");

interface IndexOfLikeParams {
    item:any;
    reversed?:boolean;
    isPredicate?:boolean;
    context?:any;
    defaultValue?:CodeText<any>;
}

interface ComparatorParams {
    obj:any;
    runtimeObj:CodeText<any>;
    declareTemp:(level:number)=>CodeText<any>;
    level:number;
    visited:any[];
    runtimeVisited:CodeText<any>[];
}

const filterMapObjectBefore = setResult(obj());
const filterMapObjectAfter = assign(prop(result, index), current);

const numberClassName = '[object Number]';
const stringClassName = '[object String]';
const regExpClassName = '[object RegExp]';
const booleanClassName = '[object Boolean]';
const dateClassName = '[object Date]';
const arrayClassName = '[object Array]';
const objectClassName = '[object Object]';
const toString = Object.prototype.toString;

function isClass(obj:CodeText<any>, name:string):CodeText<boolean> {
    return eq(call(param(toString), null, obj), literal(name));
}

function comparator(params:ComparatorParams):CodeText<boolean> {
    var obj:any = params.obj;
    var runtimeObj:CodeText<any> = params.runtimeObj;

    if (obj == null) {
        return eq(runtimeObj, obj === null ? nullValue : undef);
    }
    var objClassName = toString.call(obj);
    if (objClassName === numberClassName) {
        var isNumberClass = isClass(runtimeObj, numberClassName);
        if (+obj === 0) {
            return and(
                par(or(eq(runtimeObj, literal(0)), par(and(isNumberClass, eq(toNum(runtimeObj), literal(0)))))),
                eq(divide(literal(1), runtimeObj), literal(1 / obj))
            );
        } else if (+obj !== +obj) { //NaN
            return or(neq(runtimeObj, runtimeObj), par(and(isNumberClass, neq(toNum(runtimeObj), toNum(runtimeObj)))));
        } else {
            return or(eq(runtimeObj, literal(+obj)), par(and(isNumberClass, eq(toNum(runtimeObj), literal(+obj)))));
        }
    } else if (objClassName === stringClassName || objClassName === regExpClassName) {
        if (objClassName === stringClassName) {
            obj = obj + '';
        }
        return or(eq(runtimeObj, param(obj)), par(and(isClass(runtimeObj, objClassName), eq(toStr(runtimeObj), literal(obj + '')))));
    } else if (objClassName === dateClassName || objClassName === booleanClassName) {
        return and(isClass(runtimeObj, objClassName), eq(toNum(runtimeObj), literal(+obj)));
    } else if (objClassName === arrayClassName || objClassName === objectClassName) {
        return and(isClass(runtimeObj, objClassName), par(collectionComparator(params)));
    } else {
        return eq(runtimeObj, param(obj));
    }
}

function collectionComparator(params:ComparatorParams):CodeText<boolean> {
    var collection:any = params.obj;
    var runtimeObj:CodeText<any> = params.runtimeObj;
    var visited:any[] = params.visited;
    var runtimeVisited:CodeText<any>[] = params.runtimeVisited;

    var isArray = Object.prototype.toString.call(collection) === arrayClassName;

    var byValueComparison:CodeText<boolean>;
    if (isArray) {
        byValueComparison = eq(prop(runtimeObj, 'length'), literal(collection.length));
    } else {
        let keysCount = Object.keys(collection).length;
        byValueComparison = eq(prop(call(param(Object.keys), [runtimeObj]), 'length'), literal(keysCount));

        if (typeof collection.constructor === 'function') {
            //todo match underscore constructor comparison technique?
            let runtimeConstructor = prop(runtimeObj, 'constructor');
            let noConstructor = neq(type(runtimeConstructor), literal('function'));
            let constructorsEquals = par(or(noConstructor, eq(runtimeConstructor, param(collection.constructor))));
            byValueComparison = par(and(constructorsEquals, byValueComparison));
        }
    }

    var index = visited.indexOf(collection);
    if (index !== -1) {
        return eq(runtimeObj, runtimeVisited[index]);
    }
    visited.push(collection);
    runtimeVisited.push(runtimeObj);

    var tmp = params.declareTemp(params.level);

    function addByValueComparison(i:string|number):void {
        var valueEquals = par(comma(assign(tmp, prop(runtimeObj, i), true), comparator({
            obj: collection[i],
            runtimeObj: tmp,
            declareTemp: params.declareTemp,
            level: params.level + 1,
            visited: visited,
            runtimeVisited: runtimeVisited
        })));
        if (!isArray) {
            valueEquals = par(and(call(param(hasOwnProperty), [literal(i)], runtimeObj), valueEquals));
        }
        byValueComparison = and(byValueComparison, valueEquals);
    }

    if (isArray) {
        for (let i = 0; i < collection.length; i++) {
            addByValueComparison(i);
        }
    } else {
        for (let i in collection as Object) {
            if (hasOwnProperty.call(collection, i)) {
                addByValueComparison(i);
            }
        }
    }

    visited.pop();
    runtimeVisited.pop();

    return or(eq(runtimeObj, param(collection)), par(byValueComparison));
}

function createPropertyOf(obj) {
    if (obj === null) {
        return function () {
        };
    } else {
        return function (key) {
            return obj[key];
        };
    }
}

function createPropertyMatcher(key) {
    return function (obj) {
        return obj == null ? void 0 : obj[key];
    };
}

function matcher(attrs:Object):(object?:any)=>boolean {
    var copy = {};
    for (var key in attrs) {
        if (hasOwnProperty.call(attrs, key)) {
            copy[key] = attrs[key];
        }
    }
    attrs = copy;
    return function (object?:any):boolean {
        object = Object(object);
        for (var key in attrs) {
            /* istanbul ignore else */
            if (hasOwnProperty.call(attrs, key)) {
                if (attrs[key] !== object[key] || !(key in object)) {
                    return false;
                }
            }
        }
        return true;
    };
}

abstract class ObjectsDataPipe<R,T> extends CollectionsDataPipe<R,T> {

    keys():DataPipe<R,string> {
        return this.subPipe<string>(CollectionType.ARRAY, isObjectConditional(
            this.type,
            result,
            setResult(call(param(Object.keys), [result])),
            setResult(array())
        ), ResultCreation.NEW_OBJECT);
    }

    allKeys():DataPipe<R,string> {
        return this.toIterable().mapLike<string>(assign(current, index), true);
    }

    values():DataPipe<R,T> {
        return this.toIterable().map<T>();
    }

    mapObject<O>(iteratee?:Iteratee<T,O>, context?:any):DataPipe<R,O> {
        return this.mapObjectLike<O>(assign(current, access(toAccessible(iteratee), context)));
    }

    pairs():DataPipe<R,{0:string,1:T}> {
        return this.toIterable().mapLike<any>(assign(current, array(index, current))); //todo assignCurrent method
    }

    invert():DataPipe<R,string> {
        return this.mapObjectLike<string>(empty, assign(prop(result, current), toStr(index)));
    }

    create(props):DataPipe<R,T> {
        var propAssignments:CodeText<void>[] = [];
        if (props) {
            for (var i in props) {
                if (hasOwnProperty.call(props, i)) {
                    propAssignments.push(assign(prop(result, i), param(props[i])));
                }
            }
        }

        return this.subPipe<T>(CollectionType.MAP, seq([
            isObjectConditional(
                this.type,
                result,
                setResult(callParam(Object.create, null, [result])),
                setResult(obj())
            ),
            seq(propAssignments)
        ]), ResultCreation.NEW_OBJECT);
    }

    methods:typeof ObjectsDataPipe.prototype.functions;

    functions():DataPipe<R,string> { //todo find similar
        return this.toIterable()
            .subPipe<T>(CollectionType.MAP, {
                rename: true,
                before: filterMapObjectBefore,
                after: filterMapObjectAfter,
                text: conditional(
                    neq(type(current), literal('function')),
                    cont
                ),
                mergeStart: true,
                mergeEnd: true,
                includeParent: true
            }, ResultCreation.NEW_OBJECT)
            .mapLike<string>(assign(current, index), true);
    }

    findKey(predicate?:Predicate<T>, context?:any):DataPipeResult<R,string> {
        return this.toIterable().indexOfLike<string>({
            item: predicate,
            isPredicate: true,
            context: context,
            defaultValue: undef
        });
    }

    extend(...sources:any[]):DataPipe<R,T> {
        return this.extendLike(sources, true);
    }

    assign:typeof ObjectsDataPipe.prototype.extendOwn;

    extendOwn(...sources:any[]):DataPipe<R,T> {
        return this.extendLike(sources, false);
    }

    pick(predicate:(prop?:string)=>boolean, context?:any):DataPipe<R,T>
    pick(...properties:string[]):DataPipe<R,T>
    pick(predicate:string|((prop?:string)=>boolean), context?:any):DataPipe<R,T> {
        return this.pickLike(arguments, false);
    }

    omit(predicate:(prop?:string)=>boolean, context?:any):DataPipe<R,T>
    omit(...properties:string[]):DataPipe<R,T>
    omit(predicate:string|((prop?:string)=>boolean), context?:any):DataPipe<R,T> {
        return this.pickLike(arguments, true);
    }

    defaults(...defaults:any[]):DataPipe<R,T> {
        return this.extendLike(defaults, true, true);
    }

    clone():DataPipe<R,T> {
        if (this.hasNewResult()) {
            return this.asDataPipe();
        }
        switch (this.type) {
            case CollectionType.ARRAY:
                return this.toArray();
            case CollectionType.MAP:
                return this.mapObject<T>();
            case CollectionType.UNKNOWN:
                return this.subPipe<T>(CollectionType.UNKNOWN, {
                    createCode: (ctx:Context)=> {
                        return {
                            rename: true,
                            before: ctx.array ? itarMapBefore : filterMapObjectBefore,
                            after: ctx.array ? itarMapAfter : filterMapObjectAfter,
                            text: empty,
                            mergeStart: true,
                            mergeEnd: true,
                            includeParent: true
                        };
                    },
                    primitiveCode: empty,
                    handlesSize: false
                }, ResultCreation.NEW_OBJECT);
        }
    }

    tap(interceptor:(t?:T)=>any):DataPipe<R,T> {
        var code = statement(callParam(interceptor, null, [result]));
        return this.subPipe<T>(this.type, code, ResultCreation.USES_PREVIOUS);
    }

    has(property:string):DataPipeResult<R,boolean> {
        var value = and(neql(result, nullValue), call(param(hasOwnProperty), [param(property)], result));
        return this.resultPipe<any>(setResult(value), true);
    }

    matches:typeof ObjectsDataPipe.prototype.matcher;

    matcher():DataPipeResult<R,(o:any)=>boolean> {
        return this.resultPipe<any>(setResult(callParam(matcher, null, [result])), true);
    }

    property():DataPipeResult<R,(o:any)=>any> {
        var fn = callParam(createPropertyMatcher, null, [toStr(result)]);
        return this.resultPipe<any>(setResult(fn), true);
    }

    propertyOf():DataPipeResult<R,(s:string)=>any> {
        return this.resultPipe<any>(setResult(callParam(createPropertyOf, null, [result])), true);
    }

    isEqual(obj:any):DataPipeResult<R,boolean> {
        var temps = [];
        var codes:CodeText<void>[] = [];
        var comparison = setResult(comparator({
            obj: obj,
            runtimeObj: result,
            declareTemp: function (level:number) {
                var varName = named('temp' + level);
                if (temps.indexOf(level) === -1) {
                    temps.push(level);
                    codes.push(declare(varName));
                }
                return varName;
            },
            level: 0,
            visited: [],
            runtimeVisited: []
        }));
        codes.push(comparison);
        return this.resultPipe<boolean>(seq(codes), true);
    }

    isMatch(properties:Properties):DataPipeResult<R,boolean> {
        return this.resultPipe<boolean>(setResult(callParam(whereFilter(properties), null, [result])), true);
    }

    isEmpty():DataPipeResult<R,boolean> {
        return this.resultPipe<boolean>({
            createCode: (ctx:Context)=> {
                if (ctx.array) {
                    return setResult(eq(prop(result, 'length'), literal(0)));
                } else {
                    return {
                        before: setResult(trueValue),
                        after: seq([setResult(falseValue), br]),
                        text: empty,
                        mergeStart: true,
                        mergeEnd: false,
                        rename: true
                    };
                }
            },
            handlesSize: false
        }, true);
    }

    isArray():DataPipeResult<R,boolean> {
        var value:CodeText<boolean>;
        if (this.type === CollectionType.ARRAY) {
            value = trueValue;
        } else {
            value = call(param(isArray), [result]);
        }
        return this.resultPipe<boolean>(setResult(value), true);
    }

    isObject():DataPipeResult<R,boolean> {
        var value:CodeText<boolean>;
        if (this.type === CollectionType.UNKNOWN) {
            value = isObjectType(type(result));
        } else {
            value = trueValue;
        }
        return this.resultPipe<boolean>(setResult(value), true);
    }

    isArguments():DataPipeResult<R,boolean> { //todo use hint in every is... method
        return this.is('[object Arguments]');
    }

    isFunction():DataPipeResult<R,boolean> {
        return this.resultPipe<boolean>(setResult(eq(type(result), literal('function'))), true);
    }

    isString():DataPipeResult<R,boolean> {
        return this.is(stringClassName);
    }

    isNumber():DataPipeResult<R,boolean> {
        return this.is(numberClassName);
    }

    isFinite():DataPipeResult<R,boolean> {
        var value = and(call(param(isFinite), [result]), not(call(param(isNaN), [call(param(parseFloat), [result])])));
        return this.resultPipe<boolean>(setResult(value), true);
    }

    isBoolean():DataPipeResult<R,boolean> {
        return this.is(booleanClassName);
    }

    isDate():DataPipeResult<R,boolean> {
        return this.is(dateClassName);
    }

    isRegExp():DataPipeResult<R,boolean> {
        return this.is(regExpClassName);
    }

    isError():DataPipeResult<R,boolean> {
        return this.is('[object Error]');
    }

    isNaN():DataPipeResult<R,boolean> {
        var code = setResult(and(isClass(result, numberClassName), neq(toNum(result), toNum(result))));
        return this.resultPipe<boolean>(code, true);
    }

    isNull():DataPipeResult<R,boolean> {
        return this.resultPipe<boolean>(setResult(eq(result, nullValue)), true);
    }

    isUndefined():DataPipeResult<R,boolean> {
        return this.resultPipe<boolean>(setResult(eq(result, undef)), true);
    }

    protected indexOfLike<O extends number|string>(params:IndexOfLikeParams):DataPipeResult<R,O> {
        var condition:CodeText<boolean>;
        if (params.isPredicate) {
            condition = access(toAccessible(params.item), params.context)
        } else {
            condition = eq(current, param(params.item));
        }
        return this.reduceLike(CollectionType.UNKNOWN, setResult(params.defaultValue || literal(-1)), conditional(
            condition,
            seq([
                setResult(index),
                br
            ])
        ), params.reversed) as any;
    }

    private toIterable():DataPipe<R,T> {
        if (this.type === CollectionType.UNKNOWN) {
            return this.subPipe<T>(CollectionType.MAP, isObjectConditional(
                this.type,
                result,
                empty,
                setResult(obj())
            ), ResultCreation.USES_PREVIOUS);
        }
        return this.asDataPipe();
    }

    private mapObjectLike<O>(text:CodeText<any>, after?:CodeText<any>):DataPipe<R,O> {
        return this.toIterable().subPipe<O>(CollectionType.MAP, {
            rename: true,
            before: filterMapObjectBefore,
            after: after || filterMapObjectAfter,
            text: text,
            mergeStart: true,
            mergeEnd: true
        }, ResultCreation.NEW_OBJECT);
    }

    private pickLike(args:IArguments, invert:boolean):DataPipe<R,T> {
        var dataOld = named<{[index:string]:any}>('dataOld'); //todo make it common

        var statements:CodeText<void>[] = [];

        var predicate:(...args)=>boolean = args[0];
        var context = args[1];
        if (typeof predicate === 'function') {
            var callPredicate = callParam(predicate, context);
            if (!invert) {
                callPredicate = not(callPredicate);
            }
            statements.push(itin( //todo create filterMap step which can be merged
                dataOld,
                seq([
                    declare(current, prop(dataOld, index)),
                    conditional(
                        callPredicate,
                        cont,
                        filterMapObjectAfter
                    )
                ])
            ));
        } else {
            let properties:string[] = [];
            flattenTo(args, properties);

            if (invert && properties.length > 0) {
                let indexInProperties:CodeText<boolean>;
                for (var i = 0; i < properties.length; i++) {
                    var condition = eq(index, literal(properties[i] + ''));
                    if (indexInProperties) {
                        indexInProperties = or(indexInProperties, condition);
                    } else {
                        indexInProperties = condition;
                    }
                }

                statements.push(itin(
                    dataOld,
                    seq([
                        conditional(
                            indexInProperties,
                            cont,
                            assign(prop(result, index), current)
                        )
                    ])
                ));
            } else {
                for (var i = 0; i < properties.length; i++) {
                    var property = properties[i] + '';
                    statements.push(assign(prop(result, property), prop(dataOld, property)));
                }
            }
        }

        return this.subPipe<T>(CollectionType.MAP, seq([
            declare(dataOld, result),
            assign(result, obj()),
            conditional(
                neql(dataOld, nullValue),
                seq(statements)
            )
        ]), ResultCreation.NEW_OBJECT);
    }

    private extendLike(sources:any[], includeParent:boolean, undefinedOnly?:boolean) {
        var merged = {};
        for (let i = 0; i < sources.length; i++) {
            var source:Object = sources[i];
            let type = typeof source;
            if (type === 'object' || type === 'function') {
                for (let key in source) {
                    if (hasOwnProperty.call(source, key) || includeParent) {
                        if (!undefinedOnly || merged[key] === void 0) {
                            merged[key] = source[key];
                        }
                    }
                }
            }
        }
        var statements:CodeText<void>[] = [];
        for (let key in merged) {
            /* istanbul ignore else  */
            if (hasOwnProperty.call(merged, key)) {
                var assignment = assign(prop(result, key), param(merged[key]));
                var statement:CodeText<void>;
                if (undefinedOnly) {
                    statement = conditional(eq(prop(result, key), undef), assignment);
                } else {
                    statement = assignment;
                }
                statements.push(statement);
            }
        }
        return this.subPipe<T>(CollectionType.MAP, conditional(
            neql(result, nullValue),
            seq(statements)
        ), ResultCreation.USES_PREVIOUS);
    }

    private is(className:string):DataPipeResult<R,boolean> {
        return this.resultPipe<boolean>(setResult(isClass(result, className)), true);
    }
}
ObjectsDataPipe.prototype.matches = ObjectsDataPipe.prototype.matcher;
ObjectsDataPipe.prototype.methods = ObjectsDataPipe.prototype.functions;
ObjectsDataPipe.prototype.assign = ObjectsDataPipe.prototype.extendOwn;

export = ObjectsDataPipe;
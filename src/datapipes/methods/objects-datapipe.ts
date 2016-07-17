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
    toStr
} from "../../code-helpers";
import {ResultCreation, toAccessible, DataPipeResult, whereFilter, flattenTo} from "../datapipe-common";
import {createIsEqualCode} from "../is-equal";
import DataPipe = require("../datapipe");


interface IndexOfLikeParams {
    item:any;
    reversed?:boolean;
    isPredicate?:boolean;
    context?:any;
    defaultValue?:CodeText<any>;
}

const filterMapObjectBefore = setResult(obj());
const filterMapObjectAfter = assign(prop(result, index), current);


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
        return this.mapObjectLike<string>(empty, assign(prop(result, current), index));
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
        return this.resultPipe<boolean>(createIsEqualCode(obj), true);
    }

    isMatch(properties:Properties):DataPipeResult<R,boolean> {
        return this.resultPipe<boolean>(setResult(callParam(whereFilter(properties), null, [result])), true);
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
}

export = ObjectsDataPipe;
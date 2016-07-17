import {
    eq,
    call,
    param,
    nullValue,
    undef,
    literal,
    and,
    or,
    par,
    divide,
    neq,
    toNum,
    toStr,
    prop,
    type,
    hasOwnProperty,
    comma,
    assign,
    declare,
    setResult,
    named,
    result,
    seq
} from "../code-helpers";

var numberClassName = '[object Number]';
var stringClassName = '[object String]';
var regExpClassName = '[object RegExp]';
var booleanClassName = '[object Boolean]';
var dateClassName = '[object Date]';
var arrayClassName = '[object Array]';
var objectClassName = '[object Object]';

interface ComparatorParams {
    obj:any;
    runtimeObj:CodeText<any>;
    declareTemp:(level:number)=>CodeText<any>;
    level:number;
    visited:any[];
    runtimeVisited:CodeText<any>[];
}

export function createIsEqualCode(obj:any):CodeText<void> {
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
    return seq(codes);
}

function comparator(params:ComparatorParams):CodeText<boolean> {
    var obj:any = params.obj;
    var runtimeObj:CodeText<any> = params.runtimeObj;

    function isClass(name):CodeText<boolean> {
        return eq(call(param(Object.prototype.toString), null, runtimeObj), literal(name));
    }

    if (obj == null) {
        return eq(runtimeObj, obj === null ? nullValue : undef);
    }
    var objClassName = Object.prototype.toString.call(obj);
    if (objClassName === numberClassName) {
        var isNumberClass = isClass(numberClassName);
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
        return or(eq(runtimeObj, param(obj)), par(and(isClass(objClassName), eq(toStr(runtimeObj), literal(obj + '')))));
    } else if (objClassName === dateClassName || objClassName === booleanClassName) {
        return and(isClass(objClassName), eq(toNum(runtimeObj), literal(+obj)));
    } else if (objClassName === arrayClassName || objClassName === objectClassName) {
        return and(isClass(objClassName), par(collectionComparator(params)));
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
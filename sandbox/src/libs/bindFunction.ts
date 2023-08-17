import { isFunction, isBoundFunction } from "@minister/utils";

const boundedMap = new WeakMap();
/**
 * 是否绑定过原始对象的方法
 * @param value 
 * @returns 
 */
export function isBoundedFunction(value) {
    if (boundedMap.has(value)) {
        return boundedMap.get(value);
    }
    // bind function
    const boundFunction = isBoundFunction(value);
    boundedMap.set(value, boundFunction);
    return boundFunction;
}
const constructorMap = new WeakMap();
function isConstructor(value) {
    if (constructorMap.has(value)) {
        return constructorMap.get(value);
    }
    const valueStr = value.toString();
    const result =
        (value.prototype &&
            value.prototype.constructor === value &&
            Object.getOwnPropertyNames(value.prototype).length > 1) ||
        /^function\s+[A-Z]/.test(valueStr) ||
        /^class\s+/.test(valueStr);
    constructorMap.set(value, result);
    return result;
}

const rawWindowMethodMap = new WeakMap();
/**
 * 将方法绑定到原有对象上，避免在执行this的时候报错
 * @param raw
 * @param fn
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default function bindFunctionToRaw(raw: Object, fn: Function) {
    if (typeof fn !== "function") return fn;
    if (rawWindowMethodMap.has(fn)) {
        return rawWindowMethodMap.get(fn);
    }
    if (isFunction(fn) && !isConstructor(fn) && !isBoundedFunction(fn)) {
        const bindRawWindowValue = fn.bind(raw);
        for (const key in fn) {
            bindRawWindowValue[key] = fn[key];
        }
        if (fn.hasOwnProperty("prototype") && !bindRawWindowValue.hasOwnProperty("prototype")) {
            bindRawWindowValue.prototype = fn.prototype;
        }
        rawWindowMethodMap.set(fn, bindRawWindowValue);
        return bindRawWindowValue;
    }
    return fn;
}

import { isString, noop, unique } from "@minister/utils";
import { IProxyOptions } from "./types";
import bindFunctionToRaw from "../libs/bindFunction";

/**
 * 通用劫持原生对象类
 * */
export default class MiniProxy {
    target: any;
    rawObject: any;
    options: IProxyOptions;
    injectedKeys = new Set();
    escapeKeys = new Set();
    descriptorTargetMap = new Map();
    public proxyInstance;
    constructor(rawObject, target = {}, options: IProxyOptions = {}) {
        this.target = target;
        this.rawObject = rawObject;
        this.options = options;
        this.createProxy();
    }
    assignTarget(target) {
        Object.assign(this.target, target);
    }
    hasOwnProperty(key) {
        // return this.target.hasOwnProperty(key) || this.rawObject.hasOwnProperty(key);
    }

    private getter(target, key) {
        const { selfKeys = [], scopeProperties = [], scopePropertyKeyPrefix = "", unscopables = [] } = this.options;
        // 配合 with 不会在当前作用域寻找 unscopables属性
        if (key === Symbol.unscopables) return unscopables;
        // 访问自身元素
        if (selfKeys.includes(key)) {
            return this.proxyInstance;
        }
        if (key === "hasOwnProperty") return this.hasOwnProperty;
        // 特殊处理
        if (Reflect.has(target, key)) {
            return Reflect.get(target, key);
        }
        if (scopeProperties.includes(key)) {
            return Reflect.get(target, key);
        }
        if (scopePropertyKeyPrefix && isString(key) && new RegExp(`/^${scopePropertyKeyPrefix}/`).test(key)) {
            return Reflect.get(target, key);
        }
        const rawValue = Reflect.get(this.rawObject, key);
        if (rawValue) {
            // console.log("bindFunctionToRaw", this.rawObject, rawValue);
            return bindFunctionToRaw(this.rawObject, rawValue);
        }
        return Reflect.get(this.rawObject, key);
        
    }

    private setter(target, key, value) {
        const { scopeProperties = [], escapeProperties = [] } = this.options;
        const { escapeSetterKeyList = [] } = this.options;
        if(scopeProperties.includes(key)) {
            return Reflect.set(target, key, value);
        }
        else if (escapeSetterKeyList.includes(key)) {
            Reflect.set(this.rawObject, key, value);
        } else if (
            !target.hasOwnProperty(key) &&
            this.rawObject.hasOwnProperty(key) &&
            !scopeProperties.includes(key)
        ) {
            const descriptor = Object.getOwnPropertyDescriptor(this.rawObject, key);
            const { writable, configurable, enumerable } = descriptor || {};
            if (writable) {
                Object.defineProperty(target, key, {
                    configurable,
                    enumerable,
                    writable,
                    value,
                });
                this.injectedKeys.add(key);
            }
        } else {
            Reflect.set(target, key, value);
            this.injectedKeys.add(key);
        }
        if (escapeProperties.includes(key) && !scopeProperties.includes(key)) {
            Reflect.set(this.rawObject, key, value);
            this.escapeKeys.add(key);
        }

        return true;
    }
    createProxy() {
        const { scopeProperties = [], unscopables = [], set = noop, get = noop } = this.options;
        return (this.proxyInstance = new Proxy(this.target, {
            // 入参目标对象、属性名和 proxy 实例本身
            get: (target, key) => {
                return get(target, key) || this.getter(target, key);
            },
            // 目标对象、属性名、属性值和 Proxy 实例本身
            set: (target, key, value) => {
                return set(target, key, value) || this.setter(target, key, value);
            },
            has: (target, key) => {
                if (scopeProperties.includes(key)) return key in target;
                return key in unscopables || key in target || key in this.rawObject;
            },
            // Object.getOwnPropertyDescriptor(window, key)
            // TODO: use set
            getOwnPropertyDescriptor: (target, key) => {
                if (target.hasOwnProperty(key)) {
                    this.descriptorTargetMap.set(key, "target");
                    return Object.getOwnPropertyDescriptor(target, key);
                }
                if (this.rawObject.hasOwnProperty(key)) {
                    // like console, alert ...
                    this.descriptorTargetMap.set(key, "this.rawObject");
                    const descriptor = Object.getOwnPropertyDescriptor(this.rawObject, key);
                    if (descriptor && !descriptor.configurable) {
                        descriptor.configurable = true;
                    }
                    return descriptor;
                }
                return undefined;
            },
            // Object.defineProperty(window, key, Descriptor)
            // 注意安卓/ios低版本无法拦截此方法 @See https://github.com/ambit-tsai/es6-proxy-polyfill
            defineProperty: (target, key, value) => {
                const from = this.descriptorTargetMap.get(key);
                if (from === "this.rawObject") {
                    return Reflect.defineProperty(this.rawObject, key, value);
                }
                return Reflect.defineProperty(target, key, value);
            },
            // 注意安卓/ios低版本无法拦截此方法
            // 用来拦截对象自身属性的读取操作。 拦截特定的几个方法，包括 Object.getOwnPropertyNames(window)
            ownKeys: target => {
                return unique(Reflect.ownKeys(this.rawObject).concat(Reflect.ownKeys(target)));
            },
            // 注意安卓/ios低版本无法拦截此方法
            // 用于拦截delete操作，如果这个方法抛出错误或者返回false，当前属性就无法被delete命令删除。
            deleteProperty: (target, key) => {
                if (target.hasOwnProperty(key)) {
                    this.injectedKeys.has(key) && this.injectedKeys.delete(key);
                    this.escapeKeys.has(key) && Reflect.deleteProperty(this.rawObject, key);
                    return Reflect.deleteProperty(target, key);
                }
                return true;
            },
        }));
    }
    clear() {
        this.injectedKeys.forEach(key => {
            Reflect.deleteProperty(this.target, key as string);
        });
        this.injectedKeys.clear();
        this.escapeKeys.forEach(key => {
            Reflect.deleteProperty(this.rawObject, key as string);
        });
        this.escapeKeys.clear();
    }
}

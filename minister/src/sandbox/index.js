import bindFunctionToRawWidow from './bind_function';
import { unique, setCurrentAppName, defer, getEffectivePath, removeDomScope, isString, isPlainObject, isArray, } from '../libs/utils';
import effect, { effectDocumentEvent, releaseEffectDocumentEvent } from './effect';
import globalEnv from '../libs/global_env';
//  可以转义到rawWindow的变量
const staticEscapeProperties = [
    'System',
    '__cjsWrapper',
    '__REACT_ERROR_OVERLAY_GLOBAL_HOOK__',
];
// 只能赋值给rawWindow的变量
const escapeSetterKeyList = [
    'location',
];
// with(window){}下不代理的属性
const unscopables = {
    undefined: true,
    Array: true,
    Object: true,
    String: true,
    Boolean: true,
    Math: true,
    Number: true,
    Symbol: true,
    parseFloat: true,
    Float32Array: true,
};
export default class SandBox {
    constructor(appName, url) {
        this.appName = appName;
        this.url = url;
        // 限定范围的全局属性(属性只能在microWindow中获取和设置，不能转义到rawWindow)
        this.scopeProperties = ['webpackJsonp'];
        // 可以转义到rawWindow的属性
        this.escapeProperties = [];
        // 新添加到microWindow的属性
        this.injectedKeys = new Set();
        //  属性转义到rawWindow，卸载时清除
        this.escapeKeys = new Set();
        // sandbox state
        this.active = false;
        this.microWindow = {}; // Proxy target
        const rawWindow = globalEnv.rawWindow;
        const rawDocument = globalEnv.rawDocument;
        const descriptorTargetMap = new Map();
        const hasOwnProperty = (key) => this.microWindow.hasOwnProperty(key) || rawWindow.hasOwnProperty(key);
        // 注入全局属性
        this.inject(this.microWindow, appName, url);
        // 重写全局事件监听器和超时
        Object.assign(this, effect(this.microWindow));
        // 兼容Proxy @See https://github.com/ambit-tsai/es6-proxy-polyfill
        if(typeof Proxy === "undefined"){
            console.warn("不支持proxy！");
            var Proxy = require('es6-proxy-polyfill').default;
            window.Proxy = Proxy;
        }
        
        this.proxyWindow = new Proxy(this.microWindow, {
            // 入参目标对象、属性名和 proxy 实例本身
            get: (target, key) => {
                // 配合with 不会在当前作用域寻找 unscopables属性
                if (key === Symbol.unscopables)
                    return unscopables;
                if (['window', 'self', 'globalThis'].includes(key)) {
                    return this.proxyWindow;
                }
                if (key === 'top' || key === 'parent') {
                    // not in iframe
                    if (rawWindow === rawWindow.parent) { 
                        return this.proxyWindow;
                    }
                    // iframe
                    return Reflect.get(rawWindow, key); 
                }
                if (key === 'hasOwnProperty')
                    return hasOwnProperty;
                // document.getElementById就会走这里
                if (key === 'document' || key === 'eval') {
                    if (this.active) {
                        setCurrentAppName(this.appName);
                        defer(() => {
                            // console.log(this.appName);
                            return setCurrentAppName(null)
                        });
                    }
                    switch (key) {
                        case 'document':
                            return rawDocument;
                        case 'eval':
                            return eval;
                    }
                }
                if (Reflect.has(target, key)) {
                    return Reflect.get(target, key);
                }
                if (this.scopeProperties.includes(key) ||
                    (isString(key) && /^__MINI_APP_/.test(key))) {
                    return Reflect.get(target, key);
                }
                const rawValue = Reflect.get(rawWindow, key);
                return bindFunctionToRawWidow(rawWindow, rawValue);
            },
            // 目标对象、属性名、属性值和 Proxy 实例本身
            set: (target, key, value) => {
                if (this.active) {
                    if (escapeSetterKeyList.includes(key)) {
                        Reflect.set(rawWindow, key, value);
                    }
                    else if (!target.hasOwnProperty(key) &&
                        rawWindow.hasOwnProperty(key) &&
                        !this.scopeProperties.includes(key)) {
                        const descriptor = Object.getOwnPropertyDescriptor(rawWindow, key);
                        const { writable, configurable, enumerable } = descriptor;
                        if (writable) {
                            Object.defineProperty(target, key, {
                                configurable,
                                enumerable,
                                writable,
                                value,
                            });
                            this.injectedKeys.add(key);
                        }
                    }
                    else {
                        Reflect.set(target, key, value);
                        this.injectedKeys.add(key);
                    }
                    if ((this.escapeProperties.includes(key) ||
                        (staticEscapeProperties.includes(key) && !Reflect.has(rawWindow, key))) &&
                        !this.scopeProperties.includes(key)) {
                        Reflect.set(rawWindow, key, value);
                        this.escapeKeys.add(key);
                    }
                }
                return true;
            },
            has: (target, key) => {
                if (this.scopeProperties.includes(key))
                    return key in target;
                return key in unscopables || key in target || key in rawWindow;
            },
            // Object.getOwnPropertyDescriptor(window, key)
            // TODO: use set
            getOwnPropertyDescriptor: (target, key) => {
                if (target.hasOwnProperty(key)) {
                    descriptorTargetMap.set(key, 'target');
                    return Object.getOwnPropertyDescriptor(target, key);
                }
                if (rawWindow.hasOwnProperty(key)) {
                    // like console, alert ...
                    descriptorTargetMap.set(key, 'rawWindow');
                    const descriptor = Object.getOwnPropertyDescriptor(rawWindow, key);
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
                const from = descriptorTargetMap.get(key);
                if (from === 'rawWindow') {
                    return Reflect.defineProperty(rawWindow, key, value);
                }
                return Reflect.defineProperty(target, key, value);
            },
            // 注意安卓/ios低版本无法拦截此方法
            // 用来拦截对象自身属性的读取操作。 拦截特定的几个方法，包括 Object.getOwnPropertyNames(window)
            ownKeys: (target) => {
                return unique(Reflect.ownKeys(rawWindow).concat(Reflect.ownKeys(target)));
            },
            // 注意安卓/ios低版本无法拦截此方法
            // 用于拦截delete操作，如果这个方法抛出错误或者返回false，当前属性就无法被delete命令删除。
            deleteProperty: (target, key) => {
                if (target.hasOwnProperty(key)) {
                    this.injectedKeys.has(key) && this.injectedKeys.delete(key);
                    this.escapeKeys.has(key) && Reflect.deleteProperty(rawWindow, key);
                    return Reflect.deleteProperty(target, key);
                }
                return true;
            },
        });
        console.log("this.proxyWindow:", this.proxyWindow);
    }
    // 开启沙箱 
    start(baseroute) {
        // 重复判断
        if (!this.active) {
            this.active = true;
            // 设定路由
            this.microWindow.__MINI_APP_BASE_ROUTE__ = this.microWindow.__MINI_APP_BASE_URL__ = baseroute;
            // BUG FIX: bable-polyfill@6.x
            globalEnv.rawWindow._babelPolyfill && (globalEnv.rawWindow._babelPolyfill = false);
            if (++SandBox.activeCount === 1) {
                // 拦截事件监听器
                effectDocumentEvent();
            }
        }
    }
    // 关闭沙箱
    stop() {
        if (this.active) {
            this.active = false;
            // 释放各种绑定
            this.releaseEffect();
            this.injectedKeys.forEach((key) => {
                Reflect.deleteProperty(this.microWindow, key);
            });
            this.injectedKeys.clear();
            this.escapeKeys.forEach((key) => {
                Reflect.deleteProperty(globalEnv.rawWindow, key);
            });
            this.escapeKeys.clear();
            if (--SandBox.activeCount === 0) {
                releaseEffectDocumentEvent();
            }
        }
    }
    
    /**
     * 注入全局属性给 目标 microWindow
     * @param microWindow micro window
     * @param appName app name
     * @param url app url
     */
    inject(microWindow, appName, url) {
        // 是否处于子应用环境  给子应用自己访问window的变量
        microWindow.__MINI_APP_ENVIRONMENT__ = true;
        microWindow.__MINI_APP_NAME__ = appName;
        microWindow.__MINI_APP_PUBLIC_PATH__ = getEffectivePath(url);
        microWindow.rawWindow = globalEnv.rawWindow;
        microWindow.rawDocument = globalEnv.rawDocument;
        microWindow.removeDomScope = removeDomScope;
    }
}
// 激活的沙箱数量
SandBox.activeCount = 0; 
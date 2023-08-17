declare var global;
declare var __TEST__;

export * as Logger from "./logger";
export * from "./env";
export * from "./fetch";

export * from "./url";

export const version = "__VERSION__";
// do not use isUndefined
export const isBrowser = typeof window !== "undefined";
// do not use isUndefined
export const globalThis =
    typeof global !== "undefined"
        ? global
        : typeof window !== "undefined"
        ? window
        : typeof self !== "undefined"
        ? self
        : Function("return this")();
// is Undefined
export function isUndefined(target) {
    return target === undefined;
}
// is Null
export function isNull(target) {
    return target === null;
}
// is Number
export function isNumber(target) {
    return typeof target === "number";
}
// is String
export function isString(target) {
    return typeof target === "string";
}
// is Boolean
export function isBoolean(target) {
    return typeof target === "boolean";
}
// is function
export function isFunction(target) {
    return typeof target === "function";
}
// is Array
export const isArray = Array.isArray;
// is PlainObject
export function isPlainObject(target) {
    return toString.call(target) === "[object Object]";
}
// is Promise
export function isPromise(target) {
    return toString.call(target) === "[object Promise]";
}
// is bind function
export function isBoundFunction(target) {
    return isFunction(target) && target.name.indexOf("bound ") === 0 && !target.hasOwnProperty("prototype");
}
// is ShadowRoot
export function isShadowRoot(target) {
    return typeof ShadowRoot !== "undefined" && target instanceof ShadowRoot;
}
/**
 * 格式化错误打印  包含子应用名称appName的logError 因为需要确认是使用哪个子应用的时候报出的
 * @param msg message
 * @param appName app name, default is null
 */
export function logError(msg, appName = null, ...rest) {
    const appNameTip = appName && isString(appName) ? ` app ${appName}:` : "";
    if (isString(msg)) {
        console.error(`[micro-app]${appNameTip} ${msg}`, ...rest);
    } else {
        console.error(`[micro-app]${appNameTip}`, msg, ...rest);
    }
}
/**
 * format warn log
 * @param msg message
 * @param appName app name, default is null
 */
export function logWarn(msg, appName = null, ...rest) {
    const appNameTip = appName && isString(appName) ? ` app ${appName}:` : "";
    if (isString(msg)) {
        console.warn(`[micro-app]${appNameTip} ${msg}`, ...rest);
    } else {
        console.warn(`[micro-app]${appNameTip}`, msg, ...rest);
    }
}
/**
 * async execution
 * @param fn callback
 * @param args params
 */
export function defer(fn, ...args) {
    Promise.resolve().then(fn.bind(null, ...args));
}
/**
 * Add address protocol
 * @param url address
 */
export function addProtocol(url) {
    return url.startsWith("//") ? `${location.protocol}${url}` : url;
}
/**
 * Format URL address
 * @param url address
 */
export function formatURL(url, appName = null) {
    if (!isString(url) || !url) return "";
    try {
        const { origin, pathname, search } = new URL(addProtocol(url));
        // If it ends with .html/.node/.php/.net/.etc, don’t need to add /
        if (/\.(\w+)$/.test(pathname)) {
            return `${origin}${pathname}${search}`;
        }
        const fullPath = `${origin}${pathname}/`.replace(/\/\/$/, "/");
        return /^https?:\/\//.test(fullPath) ? `${fullPath}${search}` : "";
    } catch (e) {
        logError(e, appName);
        return "";
    }
}
// export function formatName (name: string): string {
//   if (!isString(name) || !name) return ''
//   return name.replace(/(^\d+)|([^\w\d-_])/gi, '')
// }
/**
 * Get valid address, such as https://xxx/xx/xx.html to https://xxx/xx/
 * @param url app.url
 */
export function getEffectivePath(url) {
    const { origin, pathname } = new URL(url);
    if (/\.(\w+)$/.test(pathname)) {
        const fullPath = `${origin}${pathname}`;
        const pathArr = fullPath.split("/");
        pathArr.pop();
        return pathArr.join("/") + "/";
    }
    return `${origin}${pathname}/`.replace(/\/\/$/, "/");
}
export function noop() {}
/**
 * Complete address 资源路径自动补全
 * @param path address
 * @param baseURI base url(app.url)
 */
export function completionPath(path, baseURI) {
    if (!path || /^((((ht|f)tps?)|file):)?\/\//.test(path) || /^(data|blob):/.test(path)) return path;
    return new URL(path, getEffectivePath(addProtocol(baseURI))).toString();
}
/**
 * Get the folder where the link resource is located,
 *  which is used to complete the relative address in the css
 * @param linkpath full link address
 */
export function getLinkFileDir(linkpath) {
    const pathArr = linkpath.split("/");
    pathArr.pop();
    return addProtocol(pathArr.join("/") + "/");
}
/**
 * promise stream
 * @param promiseList promise list
 * @param successCb success callback
 * @param errorCb failed callback
 * @param finallyCb finally callback
 */
export function promiseStream(promiseList, successCb, errorCb, finallyCb) {
    let finishedNum = 0;
    function isFinished() {
        // 也可以使用promise.all来实现
        if (++finishedNum === promiseList.length && finallyCb) finallyCb();
    }
    promiseList.forEach((p, i) => {
        if (isPromise(p)) {
            p.then(res => {
                successCb({
                    data: res,
                    // index是为了告诉上层是哪个请求
                    index: i,
                });
                isFinished();
            }).catch(err => {
                errorCb({
                    error: err,
                    index: i,
                });
                isFinished();
            });
        } else {
            successCb({
                data: p,
                index: i,
            });
            isFinished();
        }
    });
}
// Check whether the browser supports module script
export function isSupportModuleScript() {
    const s = document.createElement("script");
    return "noModule" in s;
}
// Create a random symbol string
export function createNonceSrc() {
    return "inline-" + Math.random().toString(36).substr(2, 15);
}
// 数组去重
export function unique(array) {
    return array.filter(function (item) {
        return item in this ? false : (this[item] = true);
    }, Object.create(null));
}
// requestIdleCallback polyfill
export const requestIdleCallback =
    globalThis.requestIdleCallback ||
    function (fn) {
        const lastTime = Date.now();
        return setTimeout(function () {
            fn({
                didTimeout: false,
                timeRemaining() {
                    return Math.max(0, 50 - (Date.now() - lastTime));
                },
            });
        }, 1);
    };
/**
 * Record the currently running app.name
 */
let currentMicroAppName = null;
export function setCurrentAppName(appName) {
    currentMicroAppName = appName;
}
// get the currently running app.name
export function getCurrentAppName() {
    return currentMicroAppName;
}
// Clear appName
export function removeDomScope() {
    setCurrentAppName(null);
}
// is safari browser
export function isSafari() {
    return /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
}
/**
 * Create pure elements
 */
export function pureCreateElement(tagName, options) {
    const element = document.createElement(tagName, options);
    if (element.__MINI_APP_NAME__) delete element.__MINI_APP_NAME__;
    return element;
}
/**
 * clone origin elements to target
 * @param origin Cloned element
 * @param target Accept cloned elements
 * @param deep deep clone or transfer dom
 */
export function cloneNode(origin: Node, target, deep) {
    target.innerHTML = "";
    if (deep) {
        const clonedNode = origin.cloneNode(true);
        // @see https://developer.mozilla.org/zh-CN/docs/Web/API/Document/createDocumentFragment 创建文档片段，将元素附加到文档片段，然后将文档片段附加到DOM树。在DOM树中，文档片段被其所有的子元素所代替。
        const fragment = document.createDocumentFragment();
        Array.from(clonedNode.childNodes).forEach(node => {
            fragment.appendChild(node);
        });
        target.appendChild(fragment);
    } else {
        Array.from(origin.childNodes).forEach(node => {
            target.appendChild(node);
        });
    }
}
// is invalid key of querySelector
export function isInvalidQuerySelectorKey(key) {
    if (__TEST__) return !key || /(^\d)|([^\w\d-_$])/gi.test(key);
    return !key || /(^\d)|([^\w\d-_\u4e00-\u9fa5])/gi.test(key);
}
// unique element
export function isUniqueElement(key) {
    return /^body$/i.test(key) || /^head$/i.test(key) || /^html$/i.test(key);
}

/**
 * clone origin elements to target
 * @param origin Cloned element
 * @param target Accept cloned elements
 * @param deep 是深层克隆还是移动dom
 */
export function cloneContainer(origin: Node, target, deep) {
    target.innerHTML = "";
    if (deep) {
        const clonedNode = origin.cloneNode(true);
        const fragment = document.createDocumentFragment();
        Array.from(clonedNode.childNodes).forEach(node => {
            fragment.appendChild(node);
        });
        target.appendChild(fragment);
    } else {
        Array.from(origin.childNodes).forEach(node => {
            target.appendChild(node);
        });
    }
}

/**
 * format name
 * note the scenes:
 * 1. micro-app -> attributeChangedCallback
 * 2. event_center -> EventCenterForMicroApp -> constructor
 * 3. event_center -> EventCenterForBaseApp -> all methods
 * 4. preFetch
 * 5. plugins
 */
export function formatAppName(name) {
    if (!isString(name) || !name) return "";
    return name.replace(/(^\d+)|([^\w\d-_])/gi, "");
}

function customFlat(arr, depth = Infinity) {
    return arr.reduce((acc, cur) => {
        if (isArray(cur) && depth > 0) acc.push(...customFlat(cur, depth - 1));
        else acc.push(cur);
        return acc;
    }, []);
}

export const flatten = (arr, depth = Infinity) =>
    Array.prototype.flat ? Array.prototype.flat.call(arr, depth) : customFlat.call(arr, arr, depth);

export function isConstructor(value) {
    const valueStr = value.toString();
    const result =
        (value.prototype &&
            value.prototype.constructor === value &&
            Object.getOwnPropertyNames(value.prototype).length > 1) ||
        /^function\s+[A-Z]/.test(valueStr) ||
        /^class\s+/.test(valueStr);
    return result;
}

export function bindFunctionToRaw(raw: Object, fn: Function) {
    if (typeof fn !== "function") return fn;
    if (isFunction(fn) && !isConstructor(fn) && !isBoundFunction(fn)) {
        const bindRawWindowValue = fn.bind(raw);
        for (const key in fn) {
            bindRawWindowValue[key] = fn[key];
        }
        if (fn.hasOwnProperty("prototype") && !bindRawWindowValue.hasOwnProperty("prototype")) {
            bindRawWindowValue.prototype = fn.prototype;
        }
        return bindRawWindowValue;
    }
    return fn;
}

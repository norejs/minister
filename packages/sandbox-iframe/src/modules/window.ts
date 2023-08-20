import MiniProxy from "../libs/mini-proxy";

export const staticEscapeProperties = ["System", "__cjsWrapper", "__REACT_ERROR_OVERLAY_GLOBAL_HOOK__"];

// 只能赋值给rawWindow的变量,
export const escapeSetterKeyList = [];

// with(window){}下不代理的属性
export const withUnscopables = {
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

export const scopeProperties = ["webpackJsonp"];

// window 的代理对象
const windowProxyMap = new Map();

// with 下这些对象不代理
export const unscopables = {
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

type IWindowOption = {
    appName?: string;
    url?: string;
    rootElement?: HTMLElement;
    initValue?: Object;
    document?: any;
    location?: any;
};

export default class MWindow {
    public proxy;
    public appName;
    private rawWindow;
    private mDocument;
    private mLocation;
    constructor(rawObject, options: IWindowOption) {
        const { appName, document, location } = options;
        this.appName = appName;
        this.rawWindow = rawObject;
        this.mDocument = document;
        this.mLocation = location;
        this.init(options);
    }
    init(options) {
        const { appName, url = "", initValues = {} } = options;
        const miniWindow = {
            __MINI_APP_ENVIRONMENT__: true,
            __MINI_APP_NAME__: appName,
            ...initValues,
        };
        const historyProxy = new Proxy(
            {},
            {
                get: (target, key) => {
                    // console.log("history get", key);
                    switch (key) {
                        case "pushState":
                        case "replaceState":
                            return ((data, title, newUrl, ...args) => {
                                if(newUrl.indexOf("http") !== 0) {
                                    newUrl = url + newUrl;
                                }
                                return this.rawWindow.history[key].apply(this.rawWindow.history, [
                                    data,
                                    title,
                                    newUrl,
                                    ...args,
                                ]);
                            }).bind(this.rawWindow.history);
                    }
                    const res = Reflect.get(this.rawWindow.history, key);
                    if (typeof res === "function") {
                        return res.bind(this.rawWindow.history);
                    }
                    return res;
                },
                set: (target, key, value) => {
                    return Reflect.set(this.rawWindow.history, key, value);
                },
            }
        );
        const windowProxy = new MiniProxy(this.rawWindow, miniWindow, {
            selfKeys: ["self", "window", "globalThis", "this"],
            unscopables,
            get: (target, key) => {
                switch (key) {
                    case "location":
                        return this.mLocation;
                    case "document":
                        return this.mDocument;
                }
            },
            set: (target, key, value) => {
                
            }
        });
        this.proxy = windowProxy.proxyInstance;
    }
}

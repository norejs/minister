import { escapeSetterKeyList, scopeProperties, staticEscapeProperties } from "../common/contants";
import globalEnv from "../global";
import MiniProxy from "../proxy";
import { effectWindow } from "./effect";
import { getEffectivePath } from "@minister/utils";
import { createDocumentProxy } from "./document";
import { createLocationProxy } from "../location";
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
    appName: string;
    url: string;
    rootElement: HTMLElement;
    initValue?: Object;
    location?: Object;
};

export class WindowProxy {
    public proxyInstance;
    private unEffectWindow;
    public appName;
    constructor(options: IWindowOption) {
        const { appName } = options;
        this.appName = appName;
        this.init(options);
    }
    init(options) {
        const { appName, url, rootElement, initValues } = options;
        const { rawWindow, rawDocument } = globalEnv;
        const miniWindow = {
            __MINI_APP_ENVIRONMENT__: true,
            __MINI_APP_NAME__: appName,
            __MINI_APP_PUBLIC_PATH__: getEffectivePath(url),
            rawWindow,
            rawDocument,
            ...initValues
        };
        this.unEffectWindow = effectWindow(miniWindow);
        const { location: locationOptions = {} } = options || {};
        const documentProxy = createDocumentProxy(appName, rootElement);
        const locationProxy = createLocationProxy({ appName, ...locationOptions });

        const windowProxy = new MiniProxy(rawWindow, miniWindow, {
            selfKeys: ["self", "window", "globalThis", "this"],
            unscopables,
            scopeProperties,
            escapeSetterKeyList,
            escapeProperties: staticEscapeProperties,
            get(target, key) {
                switch (key) {
                    case "location":
                        return locationProxy.proxyInstance;
                    case "document":
                        return documentProxy.proxyInstance;
                    case "eval":
                        return eval;
                }
            },
        });
        this.proxyInstance = windowProxy;
    }
    destory() {
        this.proxyInstance.clear();
        this.unEffectWindow && this.unEffectWindow();
        try {
            windowProxyMap.delete(this.appName);
        } catch (error) {}
    }
}

export default function createWindowProxy(options) {
    // if (windowProxyMap.get(appName)) {
    //     console.warn(`windowProxy ${appName} is already exist`);
    //     return windowProxyMap.get(appName);
    // }
    const windowProxy = new WindowProxy(options);
    // windowProxyMap.set(appName, windowProxy);
    return windowProxy;
}

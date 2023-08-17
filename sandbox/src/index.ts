import { default as createWindowProxy } from "./window";
//  可以转义到rawWindow的变量
export default class SandBox {
    static activeCount = 0;
    private appName;
    private active = false;
    private url;
    private windowProxy;
    private rootElement;
    private options;
    constructor(options) {
        this.options = options;
        const { appName, url = "", rootElement } = options || {};
        this.appName = appName;
        this.url = url;
        this.rootElement = rootElement;
    }
    // 开启沙箱
    start(baseroute) {
        // 重复判断
        if (!this.active) {
            this.windowProxy = createWindowProxy({
                rootElement: this.rootElement,
                initValues: {
                    __MINI_APP__BASE_ROUTE__: baseroute,
                    __MINI_APP__BASE_URL__: baseroute,
                },
                ...this.options,
            });
            const windowName = `__MINI_APP_PROXY_WINDOW_${this.appName}__`;
            delete window[windowName];
            window[windowName] = this.windowProxy.proxyInstance.proxyInstance;
            this.active = true;
            // 设定路由
            // // BUG FIX: bable-polyfill@6.x
            // globalEnv.rawWindow._babelPolyfill && (globalEnv.rawWindow._babelPolyfill = false);
        }
    }
    // 关闭沙箱
    stop() {
        if (this.active) {
            const windowName = `__MINI_APP_PROXY_WINDOW_${this.appName}__`;
            delete window[windowName];
            window[windowName] = null;
            this.active = false;
            // 释放各种绑定
            this.windowProxy.destory();
            this.windowProxy = null;
        }
    }
}

// 激活的沙箱数量

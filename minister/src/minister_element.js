import { defer, isFunction } from "./libs/utils";
import { listenUmountOfNestedApp, replaseUnmountOfNestedApp } from "./libs/additional";
import { APP_STATUS, LIFECYCLES } from "./constants";
import CreateApp, { appInstanceMap } from "./create_app";
import { patchElementPrototypeMethods, releasePatches, rejectMicroAppStyle } from "./source/patch";
import microApp from "./minister";
import dispatchLifecyclesEvent from "./interact/lifecycles_event";
import { cacheMaps } from "./cache";

/**
 * 记录所有 mini-app elements
 * @type {Map<string, MicroAppElement>}
 */
export const elementInstanceMap = new Map();

/**
 * 定义自定义组件
 * @param tagName element tagName
 */
export function defineElement(tagName) {
    class MicroAppElement extends HTMLElement {
        constructor() {
            super();
            // <mini-app name={appName} url={appUrl}>
            this.appName = "";
            this.appUrl = "";
            this.asyncedAttributes = new Set();
            if (!this.querySelector("mini-app-head")) {
                // 第一次创建时执行
                this.performWhenFirstCreated();
            }
        }

        static get observedAttributes() {
            return ["name", "url"];
        }

        connectedCallback() {
            if (!elementInstanceMap.has(this.appName)) {
                this.performWhenFirstCreated();
            }
            defer(() => dispatchLifecyclesEvent(this, this.appName, LIFECYCLES.CREATED));
            this.observe = this.syncAttrs();
            this.initialMount();
        }

        disconnectedCallback() {
            if (this.observe) {
                this.observe.disconnect();
                Array.from(this.asyncedAttributes).forEach(attr => {
                    document.documentElement.removeAttribute(attr);
                });
                this.asyncedAttributes.clear();

                // TODO: 这里需要把之前设置在html 上的属性去掉
            }
            // 如果是 keep-alive，那么不进行卸载 只是
            if (this.getAttr("keep-alive")) {
                return this.handleHiddenKeepAliveApp();
            }
            this.unmountProcedure();
        }

        // 卸载组件
        unmountProcedure() {
            // 当组件被卸载
            elementInstanceMap.delete(this.appName);
            this.handleUnmount(this.getAttr("destory"));
            if (elementInstanceMap.size === 0) {
                releasePatches();
            }
        }

        attributeChangedCallback(attr, _oldVal, newVal) {
            if (attr === "name") {
                this.appName = newVal;
            }
            if (attr === "url") {
                this.appUrl = newVal;
            }
        }

        /**
         * 组件将被挂载到dom时 进行初始化
         */
        initialMount() {
            if (!this.appName || !this.appUrl) return;
            // 启用shadowDOM
            if (this.getAttr("shadowDOM") && !this.shadowRoot && isFunction(this.attachShadow)) {
                this.attachShadow({ mode: "open" });
            }
            const app = appInstanceMap.get(this.appName);
            const props = {
                tagName,
                name: this.appName,
                url: this.appUrl,
                container: this.shadowRoot ? this.shadowRoot : this,
                useSandbox: !this.getAttr("disableSandbox"),
                inline: this.getAttr("inline"),
                // shadowDOM样式隔离的替代品, 一旦启用shadowDOM则无需手动实现 micro-app[name="app2"] .css-conflict
                scopecss: !(this.getAttr("disableScopecss") || this.getAttr("shadowDOM")),
                baseroute: this.getAttr("baseroute"),
                // inline: undefined,
            };
            // 如果已经有了那么不再重复请求远程资源 而是直接执行 app.mount/ KeepAlive ，否则初始化 new createApp
            if (app && app.url === this.appUrl) {
                const cacheMap = cacheMaps.get(tagName);
                const isKeepAliveHidden = app.getAppStatus() === APP_STATUS.KEEP_ALIVE_HIDDEN;
                if (isKeepAliveHidden && cacheMap?.has(this.appName)) {
                    // is strategy keep-alive
                    return this.handleShowKeepAliveApp(app, true);
                }
                if (isKeepAliveHidden && !cacheMap) {
                    // is pure keep-alive
                    return this.handleShowKeepAliveApp(app);
                }
                if (app.getAppStatus() === APP_STATUS.UNMOUNT) {
                    return app.mount(props?.container);
                }
            } else {
                return this.handleCreateApp(props);
            }
        }

        // create app instance
        handleCreateApp(props) {
            const oldInstance = appInstanceMap.get(this.appName);
            if (oldInstance) {
                try {
                    oldInstance.destory();
                } catch (error) {}
            }
            const instance = new CreateApp(props);
            appInstanceMap.set(this.appName, instance);
        }
        // 当元素count为1时执行全局初始化
        // TODO: 待测试 考虑到一个页面 使用多个子应用即多个coustomElement的时候 是否会有bug
        performWhenFirstCreated() {
            if (!this.appName) {
                return;
            }
            if (elementInstanceMap.set(this.appName, this).size === 1) {
                // 补丁元素原型方法 !! 涉及元素隔离
                // patchElementPrototypeMethods();
                // 补丁 style标签样式
                // rejectMicroAppStyle();
                // 对unMount事件进行初始化 移除和添加 remove/addEventListener
                replaseUnmountOfNestedApp();
                listenUmountOfNestedApp();
            }
        }

        /**
         * 获取入参属性
         * 兼容 start(入参A)和 <micro-app 入参A>
         * @param name 配置项名称
         */
        getAttr(name) {
            // 优先取 <micro-app 入参A>
            if (this.hasAttribute(name)) {
                return this.getAttribute(name);
            }
            return microApp[name] === undefined ? false : microApp[name];
        }

        /**
         * 卸载 app
         * @param destory 当卸载的时候是否删除缓存的app实例
         */
        handleUnmount(destory) {
            const app = appInstanceMap.get(this.appName);
            if (app && APP_STATUS.UNMOUNT !== app.getAppStatus()) {
                app.unmount(destory);
            }
        }
        // 隐藏 KeepAliveApp
        handleHiddenKeepAliveApp() {
            const app = appInstanceMap.get(this.appName);
            const isStrategy = cacheMaps.has(tagName);
            if (
                app &&
                app.getAppStatus() !== APP_STATUS.UNMOUNT &&
                app.getAppStatus() !== APP_STATUS.KEEP_ALIVE_HIDDEN
            ) {
                app.hiddenKeepAliveApp(this, isStrategy);
            }
        }
        // 恢复显示 KeepAliveApp
        handleShowKeepAliveApp(app, isStrategy) {
            if (isStrategy) {
                defer(() => app.showKeepAliveApp(this.shadowRoot ?? this, this.appName));
            } else {
                // 添加到微任务，因为需要等待connectedCallback挂载dom完毕
                defer(() => app.showKeepAliveApp(this.shadowRoot ?? this));
            }
        }
        syncAttrs() {
            const observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    if (mutation.type === "attributes") {
                        if (mutation?.attributeName) {
                            this.asyncedAttributes.add(mutation.attributeName);
                            document.documentElement.setAttribute(
                                mutation.attributeName,
                                this.getAttribute(mutation.attributeName)
                            );
                        }
                    }
                });
            });
            observer.observe(this, { attributes: true });
            return observer;
        }
    }
    // 定义tagName组件
    window.customElements.define(tagName, MicroAppElement);
}

import { defineElement } from "./minister_element";
import { logError, logWarn, isBrowser } from "./libs/utils";
import { setCache } from "./cache";
import { initGlobalEnv } from "./libs/global_env";
/**
 * 暴露给用户的类 主要用来自定义配置和启动 <micro-app>
 */
class MinisterApp {
    constructor() {
        // coustomElement name
        this.tagName = "mini-app";
        // 是否启用内联script 调式 ，dev环境可以通过start入参开启
        this.inline = false;
        // 是否启用shadowDOM 由于有兼容问题  所以默认false
        this.shadowDOM = false;
        // 默认不禁用沙箱
        this.disableSandbox = false;
        this.lifeCycles = {};
        this.events = {};
    }

    start({
        tagName = "",
        inline = false,
        shadowDOM = false,
        destory = false,
        lifeCycles = {},
        disableSandbox = false,
        cacheStrategy,
        cacheCapacity,
        events = {},
    }) {
        // 判断customElements支持程度
        if (!isBrowser || !window.customElements) {
            return logError("minister is not supported in this environment");
        }
        // 校验tagName是否符合规则
        if (tagName) {
            if (/^mini-app(-\S+)?/.test(tagName)) {
                this.tagName = tagName;
            } else {
                return logError(`${tagName} is invalid tagName`);
            }
        }
        // 检测是否已经存在相同的组件 不应重复定义
        if (window.customElements.get(this.tagName)) {
            return logWarn(`element ${this.tagName} is already defined`);
        }
        // JS沙箱隔离前，提前保存原始全局变量如window、document等
        initGlobalEnv();

        // 检测是否开启缓存策略
        if (cacheStrategy) {
            setCache(cacheStrategy, cacheCapacity, this.tagName);
        }

        this.inline = inline;
        this.shadowDOM = shadowDOM;
        this.disableSandbox = disableSandbox;
        this.destory = destory;
        this.lifeCycles = lifeCycles;
        this.events = events || {};
        // 定义自定义组件
        defineElement(this.tagName);
    }
}
export default new MinisterApp();

import extractHtml from './source';
import { APP_STATUS, LIFECYCLES } from './constants';
import { cloneContainer } from './libs/utils';
import dispatchLifecyclesEvent from './interact/lifecycles_event';
import SandBoxIframe from '@minister/sandbox-iframe';
import { cacheMaps } from './cache';
import minister from './minister';
import { isRelativeUrl } from '@minister/utils';
/**
 * micro app instances
 * @type {Map<string, CreateApp>}
 */
export const appInstanceMap = new Map();

/**
 * 创建子应用类
 * @param tagName element tagName
 * @param name app name
 * @param url app url
 * @param container 绑定的 coustomElement Dom
 * @param useSandbox 是否使用js沙箱
 * @param scopecss css隔离
 * @param inline dev环境下支持子应用js code以行内<script>形式注入<mini-app-body>
 */
export default class CreateApp {
    constructor({
        tagName = '',
        name = '',
        url = '',
        container = null,
        useSandbox = true,
        scopecss = true,
        inline = false,
        baseroute = '',
    }) {
        this.tagName = tagName;
        this.name = name;
        this.url = url;
        this.container = container;
        this.useSandbox = useSandbox;
        this.inline = inline;
        this.baseroute = baseroute;
        // TODO: ? this.useSandbox && 是否要做耦合
        this.scopecss = scopecss;
        // 远程资源脚本 存储信息 包含code 利用它做缓存
        this.source = {
            links: new Map(),
            scripts: new Map(),
        };
        this.loadSourceLevel = 0;
        // 记录app实例当前的状态
        this.status = APP_STATUS.NOT_LOADED;
        // 支持keepalive
        this.keepAliveContainer = null;
        // 加载源代码
        this.loadSourceCode();
        // 开启沙箱
    }

    getAppStatus() {
        return this.status;
    }

    // Load resources
    loadSourceCode() {
        this.status = APP_STATUS.LOADING_SOURCE_CODE;
        extractHtml(this);
    }

    onLoad(html) {
        if (++this.loadSourceLevel === 1) {
            // 加载完js资源后，进入判断
            this.source.html = html;
            if (APP_STATUS.UNMOUNT === this.status) return;
            this.status = APP_STATUS.LOAD_SOURCE_FINISHED;
            this.mount();
        }
    }

    /**
     * 请求html资源失败时候的回调
     * @param e Error
     */
    onLoadError(e) {
        this.loadSourceLevel = -1;
        if (APP_STATUS.UNMOUNT !== this.status) {
            this.onerror(e);
            this.status = APP_STATUS.LOAD_SOURCE_ERROR;
        }
    }
    // 错误处理 并触发 LIFECYCLES.ERROR
    onerror(e) {
        dispatchLifecyclesEvent(this.container, this.name, LIFECYCLES.ERROR, e);
    }

    mount(newContainer) {
        // 缓存case处理
        // 如果挂载到一个新的container上，需要重新clone一份
        this.container = newContainer ? newContainer : this.container;

        // js资源未加载完全检测
        if (this.loadSourceLevel !== 1) {
            this.status = APP_STATUS.LOADING_SOURCE_CODE;
            return;
        }
        dispatchLifecyclesEvent(
            this.container,
            this.name,
            LIFECYCLES.BEFOREMOUNT
        );
        // 开始挂载到dom：this.container
        this.status = APP_STATUS.MOUNTING;

        // 组装提取出来的script和link标签
        const scripts = [];
        this.source.scripts.forEach((script, src) => {
            const { html: scriptStr } = script;
            scriptStr && scripts.push(scriptStr);
        });

        if (!this.sandbox) {
            this.sandbox = new SandBoxIframe({
                appName: this.name,
                url: this.url,
                html: this.source.html,
                // styles: [],
                scripts,
                onHashChange: (url) => {},
                onPopState: (url) => {},
                onReady: () => {
                    this.container.appendChild(this.sandbox.getRootElement());
                    this.dispatchMountedEvent();
                },
                onRedirect: this.onRedirect.bind(this),
            });
        } else if (this.sandbox.getRootElement()) {
            this.container.appendChild(this.sandbox.getRootElement());
            this.dispatchMountedEvent();
        }
    }
    onRedirect(url, type) {
        // 是否同一个应用
        if (isRelativeUrl(url, this.url)) {
            return true;
        }
        const event = dispatchLifecyclesEvent(
            this.container,
            this.name,
            LIFECYCLES.DIRECT,
            undefined,
            { url, type }
        );

        return event.defaultPrevented ? true : false;
    }
    /**
     * 触发 mounted生命周期方法
     */
    dispatchMountedEvent() {
        if (APP_STATUS.UNMOUNT !== this.status) {
            this.status = APP_STATUS.MOUNTED;
            dispatchLifecyclesEvent(
                this.container,
                this.name,
                LIFECYCLES.MOUNTED
            );
        }
    }

    /**
     * unmount
     * 当触发coustomElement的disconnectedCallback钩子的时候
     * @param destory 是否完全销毁缓存实例
     *
     * 注意每次只要<micro-app>不在当前展示的页面，就会触发disconnect => 被卸载unmount
     */
    // TODO: 猜你喜欢这一类业务 需要记录页面特定状态和数据 需要支持组件级的keep-alive
    unmount(destory) {
        // 如果之前资源就加载失败了，那么直接清空之前的资源
        if (this.status === APP_STATUS.LOAD_SOURCE_ERROR) {
            destory = true;
        }

        this.status = APP_STATUS.UNMOUNT;

        this.actionsForUnmount(destory);
    }

    /**
     * actions for unmount app
     * @param destory 开启destory，子应用在卸载后会清空缓存资源，再次渲染时重新请求数据。默认情况下，子应用被卸载后会缓存静态资源，以便在重新渲染时获得更好的性能。
     */
    actionsForUnmount(destory) {
        dispatchLifecyclesEvent(this.container, this.name, LIFECYCLES.UNMOUNT);

        this.sandBox && this.sandBox.stop();

        // 销毁缓存实例
        if (destory) {
            console.log(
                '完全删除该appName,下次访问需重新请求改app资源',
                appInstanceMap
            );
            appInstanceMap.delete(this.name);
            this.sandBox = null;
        }
        // 注意这里必须清除dom 因为mount的时候会优先取得this.container keepalive的时候可以用来保存
        // 当应用执行了unmount时，即代表该应用的容器(CustomElement实例被销毁)，当这个应用重新mount的时候，又会新new出来一个容器(CustomElement)
        // 如果this.container不是null，新new出来的容器不能赋给this.container
        // this.container = null;
    }

    /**
     * disConnectedCallback时 隐藏 KeepAliveApp
     * @param {MicroAppElement} eleInstance
     * @param {boolean} isStrategy - 是否设置了缓存策略
     */
    hiddenKeepAliveApp(eleInstance, isStrategy) {
        const cacheMap = cacheMaps.get(this.tagName);
        this.status = APP_STATUS.KEEP_ALIVE_HIDDEN;

        dispatchLifecyclesEvent(
            this.container,
            this.name,
            LIFECYCLES.AFTERHIDDEN
        );

        // 将当前的dom节点 去除外层结果，并克隆/移动到新节点 <micro-app> ...x </micro-app> => <div>...x</div>
        // 注意⚠️: cloneContainer如果是浅复制，会将this.container中的dom节点移动到this.keepAliveContainer中，移动后，this.container就变成了一个空节点
        cloneContainer(
            this.container,
            this.keepAliveContainer
                ? this.keepAliveContainer
                : (this.keepAliveContainer = document.createElement('div')),
            false
        );

        if (isStrategy) {
            cacheMap?.put(eleInstance.appName, this.keepAliveContainer);
            console.log('fuck cacheMap', cacheMap);
        }
        // 存储新dom节点
        this.container = this.keepAliveContainer;
    }

    /**
     * connectedCallback时，重新展示 KeepAliveApp
     * @param container
     * @param {(string|undefined)} appName - 该参数为undefined时，表明未使用缓存策略
     */
    showKeepAliveApp(container, appName) {
        const cacheMap = cacheMaps.get(this.tagName);
        dispatchLifecyclesEvent(container, this.name, LIFECYCLES.BEFORESHOW);

        const cacheDom = cacheMap?.get(appName);
        if (appName) {
            cloneContainer(cacheDom, container, false);
        } else {
            // 将保存的this.container clone到 container
            cloneContainer(this.container, container, false);
        }
        // 再次记录
        this.container = container;
        // 改变状态
        this.status = APP_STATUS.KEEP_ALIVE_SHOW;

        // dispatch aftershow event to base app
        dispatchLifecyclesEvent(
            this.container,
            this.name,
            LIFECYCLES.AFTERSHOW
        );
    }
    destory() {}
}

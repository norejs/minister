import { fetchContent, Logger, cloneNode, completionPath } from "@minister/utils";
import MWindow from "./window";
import MDocument from "./document";
import MLocation from "./location";
declare global {
    interface Window {
        __MINI_APP_ENVIRONMENT__: boolean;
        __MINI_APP_WINDOW__: ProxyConstructor;
        __MINI_APP_DOCUMENT__: ProxyConstructor;
        __MINI_APP_LOCATION__: ProxyConstructor;
        __INIT_MINI_APP;
    }
}

// 监听子应用的时间映射到父应用
const reflectEvents = ["hashchange", "popstate"];

// strin转换为 blob url
function objectToBlobUrl(object: any) {
    const blob = new Blob([object], { type: "text/html" });
    return URL.createObjectURL(blob);
}
function toUpperFirstCase(word: string) {
    return word.replace(/^\w/, w => w.toUpperCase());
}

type IMIframeOption = {};
export default class MIframe {
    iframe: HTMLIFrameElement;
    window: Window;
    document: Document;
    rootElement: HTMLElement;
    options: any;
    // private miniDocument;
    // private miniWindow;
    private miniLocation;
    constructor(options = {} as any) {
        this.options = options;

        this.registerGlobalFun();
        this.initIframe();
    }
    getRootElement() {
        return this.rootElement;
    }
    async initIframe() {
        const { appName = "", url = "", html, hash = "#/", scripts = [], styles = [], onReady } = this.options;
        await this.createIframe();

        const document = this.iframe.contentDocument;
        this.rootElement = document.createElement("mini-app-html");
        this.iframe.contentWindow.__INIT_MINI_APP();
        onReady && onReady();
        this.rootElement.innerHTML = html.innerHTML;
        /**
         * 这里需要保持script 上的属性一致
         */
        // 执行js
        for (var i in scripts) {
            await this.execScript(scripts[i]);
        }
        // const scriptCodes = await Promise.all(
        //     scripts.map(async (script: string): Promise<string> => {
        //         const temp = document.createElement("div");
        //         temp.innerHTML = script;
        //         const scriptElement = temp.querySelector("script");
        //         const params = attrsToString(getScriptAttributes(scriptElement));
        //         if (scriptElement) {
        //             const src = scriptElement.getAttribute("src");
        //             if (src) {
        //                 try {
        //                     const srcCode = await fetchContent(completionPath(src, url));
        //                     if (srcCode) {
        //                         const srcCodeUrl = objectToBlobUrl(this.scopeCode(srcCode));
        //                         return `<script src=${srcCodeUrl} mini-app-scoped="true" data-src="${src}" ${params}></script>`;
        //                     }
        //                 } catch (error) {
        //                     return script;
        //                 }
        //             }

        //             const code = scriptElement.textContent;
        //             if (code) {
        //                 return `<script mini-app-scoped="true" ${params}>${this.scopeCode(code)}</script>`;
        //             }
        //         }
        //         // fetchContent(script).then((code) => {
        //         // tslint-disable-next-line
        //     })
        // );

        // 构建初始化HTML
    }
    createIframe() {
        const { url, appName, hash = "#/" } = this.options;
        // TODO: 代码分割
        this.iframe = document.createElement("iframe");
        this.iframe.style.display = "none";
        this.iframe.id = appName;
        const iframeUrl = objectToBlobUrl(`
        <html>
            <head>
                <base href="${url}">
                <script>
                    window.__MINI_APP_ENVIRONMENT__ = true;
                    window.__MINI_APP_NAME__ = "${appName}";
                    window.__PARENT_APP_WINDOW__ = window.parent;
                    window.__INIT_MINI_APP = function() {
                        var __MINI_APP_PROXYS__ = window.__PARENT_APP_WINDOW__["__MINI_APP_CREATE_PROXY__"]["${appName}"](window);
                        window.__MINI_APP_LOCATION__ = __MINI_APP_PROXYS__.location;
                        window.__MINI_APP_DOCUMENT__ = __MINI_APP_PROXYS__.document;
                        window.__MINI_APP_WINDOW__ = __MINI_APP_PROXYS__.window;
                        var __MINI_APP_rawWindow = window;
                        window.__MINI_APP_REPLACE_THIS = function (obj) {
                            if(obj === __MINI_APP_rawWindow) {
                                return rawWindow.__MINI_APP_WINDOW__;
                            }
                            return obj;
                        }
                    }
                </script>
            </head>
            <body>
            </body>
        </html>
        `);
        return new Promise((resolve, reject) => {
            this.iframe.setAttribute("src", iframeUrl + hash);
            this.iframe.onload = () => {
                this.window = this.iframe.contentWindow;
                this.document = this.iframe.contentDocument;
                resolve(this.iframe);
                // URL.revokeObjectURL(iframeUrl);
            };
            document.body.appendChild(this.iframe);
        });
    }
    async execScript(script: HTMLScriptElement) {
        if (typeof script === "string") {
            const div = this.document.createElement("div");
            div.innerHTML = script;
            script = div.querySelector("script");
        }
        if (script.getAttribute("mini-app-scoped") === "true") {
            return;
        }
        script.setAttribute("mini-app-scoped", "true");
        const src = script.getAttribute("src");
        if (src) {
            return this.execUrlScript(src, true, script);
        }
        const code = script.textContent;
        if (code) {
            return this.execScriptCode(code, true, src, script);
        }
    }

    /**
     * 执行远程JS，跨域或者请求失败的情况下，直接执行
     * @param url
     * @param withSandBox
     * @returns
     */
    async execUrlScript(url: string, withSandBox = true, originScript?: HTMLScriptElement) {
        if (withSandBox) {
            try {
                const code = await fetchContent(url, this.iframe.contentWindow as any);
                if (code) {
                    
                    const scriptElement = this.document.createElement("script");
                    scriptElement.setAttribute("src", objectToBlobUrl(this.scopeCode(code)));
                    scriptElement.setAttribute("origin-src", url);
                    copyScriptAttributes(originScript, scriptElement);
                    scriptElement.setAttribute("ignore-add", "true");
                    return this.document.head.appendChild(scriptElement);
                }
                // return this.execScriptCode(code, withSandBox, url, originScript);
            } catch (error) {
                // debugger;
            }
        }
        const scriptElement = this.document.createElement("script");
        scriptElement.setAttribute("src", url);
        copyScriptAttributes(originScript, scriptElement);
        scriptElement.setAttribute("ignore-add", "true");
        this.document.head.appendChild(scriptElement);
        await new Promise((resolve, reject) => {
            setTimeout(resolve, 100);
        });
        return scriptElement;
    }

    /**
     * 执行JS代码
     * @param code
     * @param withSandBox
     * @param url
     */
    execScriptCode(code: string, withSandBox = true, url: string = "", originScript?: HTMLScriptElement) {
        const scriptElement = this.document.createElement("script");
        originScript && copyScriptAttributes(originScript, scriptElement);
        scriptElement.textContent = withSandBox ? this.scopeCode(code) : code;
        url && scriptElement.setAttribute("origin-src", url);
        scriptElement.setAttribute("ignore-add", "true");
        this.document.head.appendChild(scriptElement);
        return scriptElement;
    }

    /**
     * 初始化沙箱
     */
    private registerGlobalFun() {
        const { appName } = this.options;
        // eslint-disable-next-line
        if (!window[`__MINI_APP_CREATE_PROXY__`]) {
            window[`__MINI_APP_CREATE_PROXY__`] = {};
        }
        window[`__MINI_APP_CREATE_PROXY__`][appName] = this.createProxyEnvironment.bind(this);
    }

    private createProxyEnvironment(iframeWindow) {
        const { url, onRedirect } = this.options;
        this.window = iframeWindow;
        this.document = iframeWindow.document;

        this.reflectEvents(this.window, ["hashChange", "popState"]);

        const miniLocation = new MLocation(iframeWindow.location, {
            parentLocation: location,
            rawWindow: iframeWindow,
            url,
            onRedirect: url => {
                return onRedirect && onRedirect(url);
            },
        });
        this.miniLocation = miniLocation;

        const miniDocument = new MDocument(iframeWindow.document, {
            rootElement: this.rootElement,
            location: miniLocation.proxy,
            rawWindow: iframeWindow,
            onAddElement: (parent, newChild) => {
                console.log("pz", parent, newChild);
                // 对a标签的点击需要做特殊处理，否则会在父级页面跳转
                // if (newChild.tagName === "A") {
                //     return this.patchAchorHref(newChild);
                // }
                // if (newChild.tagName === "STYLE") {
                //     // TODO: 处理style标签
                //     return;
                // }
                // console.log("pz", newChild, "HTMLScriptElement");
                if (newChild.tagName === "SCRIPT") {
                    // console.log("pz", newChild, "HTMLScriptElement");
                    return this.execScript(newChild);
                }
            },
            onInjectScript: (_, newChild) => {
                if (newChild["mini-app-scoped"]) {
                    return;
                }
                // return this.execScript(newChild);
            },
        });
        // this.miniDocument = miniDocument;

        const miniWindow = new MWindow(iframeWindow, {
            rootElement: this.rootElement,
            document: miniDocument.proxy,
            location: miniLocation.proxy,
        });
        // this.miniWindow = miniWindow;
        return { window: miniWindow.proxy, document: miniDocument.proxy, location: miniLocation.proxy };
    }

    // 处理a标签的href
    patchAchorHref(newChild) {
        newChild.addEventListener("click", event => {
            event.preventDefault();
            const href = newChild.getAttribute("href");
            if (href) {
                this.miniLocation.proxy["href"] = href;
            }
        });
        return newChild;
    }

    reflectEvents(rawObj, events = reflectEvents) {
        events.forEach(eventName => {
            // 首字母大写
            if (this.options["on" + toUpperFirstCase(eventName)])
                rawObj.addEventListener(eventName.toLowerCase(), event => {
                    this.options["on" + toUpperFirstCase(eventName)](event);
                });
        });
    }

    /**
     * 沙箱包裹JS代码
     * @param code
     * @returns
     */
    replaceThis(code) {
        return code.replace(/\bthis\b([.\[])/g, `(window.__MINI_APP_REPLACE_THIS(this))$1`);
    }
    scopeCode(code: string) {
        return `(function (window, self, global, location, document, globalThis) {
            ${code}
        }.bind(window.__MINI_APP_WINDOW__)(
            window.__MINI_APP_WINDOW__,
            window.__MINI_APP_WINDOW__,
            window.__MINI_APP_WINDOW__,
            window.__MINI_APP_WINDOW__.location,
            window.__MINI_APP_WINDOW__.document,
            window.__MINI_APP_WINDOW__
        ))`;
    }
    destroy() {
        this.iframe.remove();
    }
}

// 复制script 的属性
function copyScriptAttributes(script: HTMLScriptElement, newScript: HTMLScriptElement, exclude = ["src"]) {
    const attrs = script.attributes;
    for (let i = 0; i < attrs.length; i++) {
        const attr = attrs[i];
        if (exclude.includes(attr.name)) continue;
        newScript.setAttribute(attr.name, attr.value);
    }
}

function getScriptAttributes(script: HTMLScriptElement, exclude = ["src"]) {
    const attrs = script.attributes;
    const result = {};
    for (let i = 0; i < attrs.length; i++) {
        const attr = attrs[i];
        if (exclude.includes(attr.name)) continue;
        result[attr.name] = attr.value;
    }
    return result;
}

function attrsToString(attrs) {
    return Object.keys(attrs)
        .map(key => `${key}="${attrs[key]}"`)
        .join(" ");
}

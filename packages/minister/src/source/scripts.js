import { fetchSource } from "./fetch";
import {
    CompletionPath,
    promiseStream,
    createNonceSrc,
    pureCreateElement,
    defer,
    logError,
    isUndefined,
    isPlainObject,
    isArray,
    isFunction,
} from "../libs/utils";
import { dispatchOnLoadEvent, dispatchOnErrorEvent } from "./load_event";
import microApp from "../minister";
import globalEnv from "../libs/global_env";
// 存储全局脚本文件，跨子应用程序，不会重复请求相同路径的资源 节省网络请求
export const globalScripts = new Map();
/**
 * 提取script元素，即处理<script>
 * @param script script element
 * @param parent parent element of script
 * @param {CreateApp} app - instance of CreateApp
 * @param isDynamic dynamic insert
 */
export function extractScriptElement(script, parent, app, isDynamic = false) {
    let replaceComment = null;
    let src = script.getAttribute("src");
    if (script.hasAttribute("exclude")) {
        replaceComment = document.createComment("script element with exclude attribute removed by micro-app");
    } else if (
        (script.type &&
            ![
                "text/javascript",
                "text/ecmascript",
                "application/javascript",
                "application/ecmascript",
                "module",
            ].includes(script.type)) ||
        script.hasAttribute("ignore")
    ) {
        return null;
    } else if (
        (globalEnv.supportModuleScript && script.noModule) ||
        (!globalEnv.supportModuleScript && script.type === "module")
    ) {
        replaceComment = document.createComment(
            `${script.noModule ? "noModule" : "module"} script ignored by micro-app`
        );
    } else if (src) {
        // remote script
        src = CompletionPath(src, app.url);
        const info = {
            code: "",
            isExternal: true,
            isDynamic: isDynamic,
            async: script.hasAttribute("async"),
            defer: script.defer || script.type === "module",
            module: script.type === "module",
            // 在link、script设置global属性会将文件提取为公共文件，共享给其它应用。
            isGlobal: script.hasAttribute("global"),
            html: script.outerHTML,
        };
        if (!isDynamic) {
            app.source.scripts.set(src, info);
            replaceComment = document.createComment(`script with src='${src}' extract by micro-app`);
        } else {
            return { url: src, infoL };
        }
    } else if (script.textContent) {
        // inline script
        const nonceStr = createNonceSrc();
        const info = {
            code: script.textContent,
            isExternal: false,
            isDynamic: isDynamic,
            async: false,
            defer: script.type === "module",
            module: script.type === "module",
            html: script.outerHTML
        };
        if (!isDynamic) {
            app.source.scripts.set(nonceStr, info);
            replaceComment = document.createComment("inline script extract by micro-app");
        } else {
            return { url: nonceStr, info };
        }
    } else if (!isDynamic) {
        // 带有空src或空脚本的脚本。在静态htmlz中删除textContent 如果它是动态创建的，则不会被删除
        replaceComment = document.createComment("script element removed by micro-app");
    }
    if (isDynamic) {
        return { replaceComment };
    } else {
        return parent.replaceChild(replaceComment, script);
    }
}
/**
 *  获取脚本的远程资源
 * @param wrapElement htmlDom
 * @param {CreateApp} app - instance of CreateApp
 */
export function fetchScriptsFromHtml(wrapElement, app) {
    const scriptEntries = Array.from(app.source.scripts.entries());
    const fetchScriptPromise = [];
    const fetchScriptPromiseInfo = [];
    for (const [url, info] of scriptEntries) {
        if (info.isExternal) {
            const globalScriptText = globalScripts.get(url);
            if (globalScriptText) {
                info.code = globalScriptText;
            } else if (!info.defer && !info.async) {
                fetchScriptPromise.push(fetchSource(url, app.name));
                fetchScriptPromiseInfo.push([url, info]);
            }
        }
    }
    if (fetchScriptPromise.length) {
        // 处理所有js资源
        promiseStream(
            fetchScriptPromise,
            res => {
                // 每个js资源完成请求后的回调
                fetchScriptSuccess(
                    fetchScriptPromiseInfo[res.index][0],
                    fetchScriptPromiseInfo[res.index][1],
                    res.data
                );
            },
            err => {
                logError(err, app.name);
            },
            () => {
                // 全部js资源加载完毕后，app.source.scripts的info.code被更新为了res.data
                app.onLoad(wrapElement);
            }
        );
    } else {
        app.onLoad(wrapElement);
    }
}
/**
 * 获取js成功，记录下来
 * @param url script address
 * @param info resource script info
 * @param data code
 */
export function fetchScriptSuccess(url, info, data) {
    if (info.isGlobal && !globalScripts.has(url)) {
        globalScripts.set(url, data);
    }
    info.code = data;
}
/**
 * 在mount生命周期中执行js
 * @param scriptList script list
 * @param {CreateApp} app - instance of CreateApp
 */
export function execScripts(scriptList, app) {
    const scriptListEntries = Array.from(scriptList.entries());
    const deferScriptPromise = [];
    const deferScriptInfo = [];
    // 遍历所有js资源
    for (const [url, info] of scriptListEntries) {
        if (!info.isDynamic) {
            if (info.defer || info.async) {
                if (info.isExternal && !info.code) {
                    deferScriptPromise.push(fetchSource(url, app.name));
                } else {
                    deferScriptPromise.push(info.code);
                }
                deferScriptInfo.push([url, info]);
            } else {
                runScript(url, info.code, app, info.module, false);
            }
        }
    }
    if (deferScriptPromise.length) {
        Promise.all(deferScriptPromise)
            .then(res => {
                res.forEach((code, index) => {
                    const [url, info] = deferScriptInfo[index];
                    runScript(url, (info.code = info.code || code), app, info.module, false);
                });
            })
            .catch(err => {
                logError(err, app.name);
            });
    } else {
        // 如果没有defer走这里
    }
}

/**
 * 在mount生命周期中执行js(简化版)
 * @param scriptList script list
 * @param {CreateApp} app - instance of CreateApp
 */
export function liteExecScripts(scriptList, app) {
    const scriptListEntries = Array.from(scriptList.entries());
    // 遍历所有js资源
    for (const [url, info] of scriptListEntries) {
        runScript(url, info.code, app, info.module, false);
    }
}
/**
 * 执行js code
 * @param url script address
 * @param code js code
 * @param {CreateApp} app - instance of CreateApp
 * @param module type='module' of script
 * @param isDynamic dynamically created script
 * @param callback callback of module script
 */
export function runScript(url, code, app, module, isDynamic, callback, originScript = null) {
    try {
        // 对于只有url没有code 的js文件直接插入script标签
        if (!code && url) {
            const scriptElement = pureCreateElement("script");
            scriptElement.setAttribute("src", url);
            setInlinScriptContent(url, code, module, scriptElement, callback);
            originScript && copyAttributes(originScript, scriptElement, ["src"]);
            if (isDynamic) {
                return scriptElement;
            }
            if (app.container) {
                const appBody = app.container.querySelector("mini-app-body");
                appBody && appBody.appendChild(scriptElement);
            }
            return;
        }
        code = code && bindScope(url, code, app, module);
        if (app.inline || module) {
            const scriptElement = pureCreateElement("script");
            originScript && copyAttributes(originScript, scriptElement, ["src"]);
            scriptElement.setAttribute("origin-url", url);
            setInlinScriptContent(url, code, module, scriptElement, callback);
            if (isDynamic) {
                return scriptElement;
            }
            // TEST IGNORE
            if (app.container) {
                const appBody = app.container.querySelector("mini-app-body");
                appBody && appBody.appendChild(scriptElement);
            }
        } else {
            // 表示执行js code
            Function(code)();
            if (isDynamic) {
                return document.createComment("dynamic script extract by micro-app");
            }
        }
    } catch (e) {
        console.error(`[micro-app from runScript] app ${app.name}: `, e);
    }
}
/**
 * 获得动态创建的远程脚本
 * @param url script address
 * @param info info
 * @param {CreateApp} app - instance of CreateApp
 * @param originScript origin script element
 */
// 复制script的属性到另一个script元素上
export function copyAttributes(elementToCopyFrom, newElement, exclude = []) {
    // First, create a new element to copy the attributes to

    // Loop through the attributes of the original element and copy them to the new element
    for (let i = 0; i < elementToCopyFrom.attributes.length; i++) {
        if (exclude.includes(elementToCopyFrom.attributes[i].name)) continue;
        const attr = elementToCopyFrom.attributes[i];
        newElement.setAttribute(attr.name, attr.value);
    }
    // Return the new element with all the same attributes as the original element.
    return newElement;
}

export function runDynamicRemoteScript(url, info, app, originScript) {
    const dispatchScriptOnLoadEvent = () => dispatchOnLoadEvent(originScript);
    if (app.source.scripts.has(url)) {
        const existInfo = app.source.scripts.get(url);
        if (!info.module) {
            defer(dispatchScriptOnLoadEvent);
        }
        return runScript(url, existInfo.code, app, info.module, true, dispatchScriptOnLoadEvent, originScript);
    }
    if (globalScripts.has(url)) {
        const code = globalScripts.get(url);
        info.code = code;
        app.source.scripts.set(url, info);
        if (!info.module) {
            defer(dispatchScriptOnLoadEvent);
        }
        return runScript(url, code, app, info.module, true, dispatchScriptOnLoadEvent, originScript);
    }
    let replaceElement;
    if (app.inline || info.module) {
        replaceElement = pureCreateElement("script");
    } else {
        replaceElement = document.createComment(`dynamic script with src='${url}' extract by micro-app`);
    }
    copyAttributes(originScript, replaceElement, ["src"]);
    fetchSource(url, app.name)
        .then(code => {
            info.code = code;
            // app.source.scripts.set(url, info);
            // if (info.isGlobal) {
            //     globalScripts.set(url, code);
            // }
            try {
                code = bindScope(url, code, app, info.module);
                if (app.inline || info.module) {
                    setInlinScriptContent(url, code, info.module, replaceElement, dispatchScriptOnLoadEvent);
                } else {
                    Function(code)();
                }
            } catch (e) {
                console.error(`[micro-app from runDynamicScript] app ${app.name}: `, e, url);
            }
            if (!info.module) {
                dispatchOnLoadEvent(originScript);
            }
        })
        .catch(err => {
            runScript(url, info.code, app, info.module, true, dispatchScriptOnLoadEvent);
            logError(err, app.name);
            // dispatchOnErrorEvent(originScript);
        });
    return replaceElement;
}
/**
 * 内联脚本的通用处理
 * @param url script address
 * @param code js code
 * @param module type='module' of script
 * @param scriptElement target script element
 * @param callback callback of module script
 */
function setInlinScriptContent(url, code, module, scriptElement, callback) {
    if (module) {
        // module script is async, transform it to a blob for subsequent operations
        const blob = new Blob([code], { type: "text/javascript" });
        scriptElement.src = URL.createObjectURL(blob);
        scriptElement.setAttribute("type", "module");
        if (!url.startsWith("inline-")) {
            scriptElement.setAttribute("originSrc", url);
        }
        if (callback) {
            callback.moduleCount && callback.moduleCount--;
            scriptElement.onload = callback.bind(scriptElement, callback.moduleCount === 0);
        }
    } else {
        scriptElement.textContent = code;
    }
}

function replaceThis(code, appName) {
    return code.replace(/\bthis\b([.\[])/g, `(window.__MINI_APP_REPLACE_THIS(this, window.__MINI_APP_NAME__))$1`);
}

/**
 * 元素隔离 & js沙箱 & 使用插件
 * @param url script address
 * @param code code
 * @param {CreateApp} app - instance of CreateApp
 * @param module type='module' of script
 */
function bindScope(url, code, app, module) {
    // 如果自定义了插件 则使用插件
    if (isPlainObject(microApp.plugins)) {
        code = usePlugins(url, code, app.name, microApp.plugins);
    }
    // 注入受控制的window
    if (app.sandBox && !module) {
        // 这里的 globalEnv.rawWindow === window
        // [app.name]
        const windowName = `__MINI_APP_PROXY_WINDOW_${app.name}__`;
        globalEnv.rawWindow[windowName] = app.sandBox.windowProxy.proxyInstance.proxyInstance;
        return `;(function(window, self){with(window){${replaceThis(
            code,
            app.name
        )}\n}}).call(window["${windowName}"], window["${windowName}"], window["${windowName}"]);`;
    }
    // 不使用js沙箱的时候，直接注入 ;考虑多个子应用的情况 rawWindow[`__MINI_APP_BASE_ROUTE__${app.name}`]
    globalEnv.rawWindow.__MINI_APP_BASE_ROUTE__ = app.baseroute;
    return code;
}
/**
 * 调用插件来处理文件
 * @param url script address
 * @param code code
 * @param appName app name
 * @param plugins plugin list
 */
function usePlugins(url, code, appName, plugins) {
    if (isArray(plugins.global)) {
        for (const plugin of plugins.global) {
            if (isPlainObject(plugin) && isFunction(plugin.loader)) {
                code = plugin.loader(code, url, plugin.options);
            }
        }
    }
    if (isArray(plugins.modules && plugins.modules[appName] && isArray(plugins.modules[appName]))) {
        for (const plugin of plugins.modules[appName]) {
            if (isPlainObject(plugin) && isFunction(plugin.loader)) {
                code = plugin.loader(code, url, plugin.options);
            }
        }
    }
    return code;
}

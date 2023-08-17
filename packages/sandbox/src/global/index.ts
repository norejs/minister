import { isSupportModuleScript, isBrowser } from "@minister/utils";

const globalEnv: any = {};
declare global {
    var __MINI_APP_BASE_APPLICATION__;
}

export function initGlobalEnv() {
    if (isBrowser) {
        /**
         * 保存补丁原始方法
         */
        const rawSetAttribute = Element.prototype.setAttribute;
        const rawAppendChild = Node.prototype.appendChild;
        const rawInsertBefore = Node.prototype.insertBefore;
        const rawReplaceChild = Node.prototype.replaceChild;
        const rawRemoveChild = Node.prototype.removeChild;
        const rawAppend = Element.prototype.append;
        const rawPrepend = Element.prototype.prepend;
        const rawCreateElement = Document.prototype.createElement;
        const rawCreateElementNS = Document.prototype.createElementNS;
        const rawCreateDocumentFragment = Document.prototype.createDocumentFragment;
        const rawQuerySelector = Document.prototype.querySelector;
        const rawQuerySelectorAll = Document.prototype.querySelectorAll;
        const rawGetElementById = Document.prototype.getElementById;
        const rawGetElementsByClassName = Document.prototype.getElementsByClassName;
        const rawGetElementsByTagName = Document.prototype.getElementsByTagName;
        const rawGetElementsByName = Document.prototype.getElementsByName;
        const rawWindow = Function("return window")();
        const rawDocument = Function("return document")();
        const supportModuleScript = isSupportModuleScript();
        const templateStyle = rawDocument.body.querySelector("#micro-app-template-style");
        /**
         * 保存副作用原始方法
         */
        const rawWindowAddEventListener = rawWindow.addEventListener;
        const rawWindowRemoveEventListener = rawWindow.removeEventListener;
        const rawSetInterval = rawWindow.setInterval;
        const rawSetTimeout = rawWindow.setTimeout;
        const rawClearInterval = rawWindow.clearInterval;
        const rawClearTimeout = rawWindow.clearTimeout;
        const rawDocumentAddEventListener = rawDocument.addEventListener;
        const rawDocumentRemoveEventListener = rawDocument.removeEventListener;
        // mark current application as base application
        window.__MINI_APP_BASE_APPLICATION__ = true;
        // window.__MINI_APP_PROXY_WINDOW__ = {};
        const rawLocation = rawWindow.location;
        Object.assign(globalEnv, {
            // source/patch
            rawSetAttribute,
            rawAppendChild,
            rawInsertBefore,
            rawReplaceChild,
            rawRemoveChild,
            rawAppend,
            rawPrepend,
            rawCreateElement,
            rawCreateElementNS,
            rawCreateDocumentFragment,
            rawQuerySelector,
            rawQuerySelectorAll,
            rawGetElementById,
            rawGetElementsByClassName,
            rawGetElementsByTagName,
            rawGetElementsByName,
            // common global vars
            rawWindow,
            rawDocument,
            supportModuleScript,
            templateStyle,
            // sandbox/effect
            rawWindowAddEventListener,
            rawWindowRemoveEventListener,
            rawSetInterval,
            rawSetTimeout,
            rawClearInterval,
            rawClearTimeout,
            rawDocumentAddEventListener,
            rawDocumentRemoveEventListener,
            rawLocation
        });
    }
}
initGlobalEnv();
export default globalEnv;

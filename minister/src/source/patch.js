import { appInstanceMap } from "../create_app";
import {
    CompletionPath,
    getCurrentAppName,
    pureCreateElement,
    setCurrentAppName,
    logWarn,
    isPlainObject,
    isString,
    //   isInvalidQuerySelectorKey,
    //   isUniqueElement,
} from "../libs/utils";
import scopedCSS from "./scoped_css";
import { extractLinkFromHtml, foramtDynamicLink } from "./links";
import { extractScriptElement, runScript, runDynamicRemoteScript } from "./scripts";
import microApp from "../minister";
import globalEnv from "../libs/global_env";
// 记录元素和映射元素
const dynamicElementInMicroAppMap = new WeakMap();
/**
 * 处理新节点并格式化style, link and script元素
 * @param parent parent node
 * @param child new node
 * @param {CreateApp} app - instance of CreateApp
 */
function handleNewNode(parent, child, app, source) {
    if (child instanceof HTMLStyleElement) {
        if (child.hasAttribute("exclude")) {
            const replaceComment = document.createComment("style element with exclude attribute ignored by micro-app");
            dynamicElementInMicroAppMap.set(child, replaceComment);
            return replaceComment;
        } else if (app.scopecss && !child.hasAttribute("ignore")) {
            return scopedCSS(child, app.name);
        }
        return child;
    } else if (child instanceof HTMLLinkElement) {
        if (child.hasAttribute("exclude")) {
            const linkReplaceComment = document.createComment(
                "link element with exclude attribute ignored by micro-app"
            );
            dynamicElementInMicroAppMap.set(child, linkReplaceComment);
            return linkReplaceComment;
        } else if (!app.scopecss || child.hasAttribute("ignore")) {
            return child;
        }
        const { url, info, replaceComment } = extractLinkFromHtml(child, parent, app, null, true);
        if (url && info) {
            const replaceStyle = pureCreateElement("style");
            replaceStyle.linkpath = url;
            foramtDynamicLink(url, info, app, child, replaceStyle);
            dynamicElementInMicroAppMap.set(child, replaceStyle);
            return replaceStyle;
        } else if (replaceComment) {
            dynamicElementInMicroAppMap.set(child, replaceComment);
            return replaceComment;
        }
        return child;
    } else if (child instanceof HTMLScriptElement) {
        const { replaceComment, url, info } = extractScriptElement(child, parent, app, true) || {};
        if (url && info) {
            if (info.code) {
                // inline script
                const replaceElement = runScript(url, info.code, app, info.module, true);
                dynamicElementInMicroAppMap.set(child, replaceElement);
                return replaceElement;
            } else {
                // remote script
                const replaceElement = runDynamicRemoteScript(url, info, app, child);
                dynamicElementInMicroAppMap.set(child, replaceElement);
                return replaceElement;
            }
        } else if (replaceComment) {
            dynamicElementInMicroAppMap.set(child, replaceComment);
            return replaceComment;
        }
        return child;
    }
    return child;
}
/**
 * 处理插入到头部和主体中的元素，并在其他情况下正常执行
 * @param {CreateApp} app - instance of CreateApp
 * @param method raw method
 * @param parent parent node
 * @param targetChild target node
 * @param passiveChild second param of insertBefore and replaceChild
 */
function invokePrototypeMethod(app, rawMethod, parent, targetChild, passiveChild) {
    /**
     * If passiveChild is not the child node, insertBefore replaceChild will have a problem, at this time, it will be degraded to appendChild
     * E.g: document.head.insertBefore(targetChild, document.head.childNodes[0])
     */
    if (parent === document.head) {
        const microAppHead = app.container.querySelector("mini-app-head");
        /**
         * 1. If passivechild exists, it must be insertBefore or replacechild
         * 2. When removeChild, targetChild may not be in microAppHead or head
         */
        if (passiveChild && !microAppHead.contains(passiveChild)) {
            return globalEnv.rawAppendChild.call(microAppHead, targetChild);
        } else if (rawMethod === globalEnv.rawRemoveChild && !microAppHead.contains(targetChild)) {
            if (parent.contains(targetChild)) {
                return rawMethod.call(parent, targetChild);
            }
            return targetChild;
        } else if (rawMethod === globalEnv.rawAppend || rawMethod === globalEnv.rawPrepend) {
            return rawMethod.call(microAppHead, targetChild);
        }
        return rawMethod.call(microAppHead, targetChild, passiveChild);
    } else if (parent === document.body) {
        const microAppBody = app.container.querySelector("mini-app-body");
        if (passiveChild && !microAppBody.contains(passiveChild)) {
            return globalEnv.rawAppendChild.call(microAppBody, targetChild);
        } else if (rawMethod === globalEnv.rawRemoveChild && !microAppBody.contains(targetChild)) {
            if (parent.contains(targetChild)) {
                return rawMethod.call(parent, targetChild);
            }
            return targetChild;
        } else if (rawMethod === globalEnv.rawAppend || rawMethod === globalEnv.rawPrepend) {
            return rawMethod.call(microAppBody, targetChild);
        }
        return rawMethod.call(microAppBody, targetChild, passiveChild);
    } else if (rawMethod === globalEnv.rawAppend || rawMethod === globalEnv.rawPrepend) {
        return rawMethod.call(parent, targetChild);
    }
    return rawMethod.call(parent, targetChild, passiveChild);
}
// Get the map element
function getMappingNode(node) {
    const dNode = dynamicElementInMicroAppMap.get(node);
    return dNode ? dNode : node;
}
/**
 * method of handle new node
 * @param parent parent node
 * @param newChild new node
 * @param passiveChild passive node
 * @param rawMethodraw method
 */

function getAppName(element) {
    if (element === null || element === document.documentElement || element === document.body) {
        return element?.__MINI_APP_NAME__ || "";
    }
    const appName = element.__MINI_APP_NAME__;
    if (!appName) {
        return getAppName(element.parentElement);
    }
    return appName;
}

function commonElementHander(parent, newChild, passiveChild, rawMethod, source) {
    if (newChild && newChild.id && !isNaN(newChild.id[0])) {
        newChild.id = "mini-app-" + newChild.id;
    }
    const appName = getAppName(parent);
    const app = appInstanceMap.get(appName);
    if (appName && app && newChild instanceof HTMLImageElement) {
        const src = newChild.getAttribute("src");
        newChild.setAttribute("src", CompletionPath(src, app.url));
    }
    if (newChild === null || newChild === void 0 ? void 0 : newChild.__MINI_APP_NAME__) {
        const app = appInstanceMap.get(newChild.__MINI_APP_NAME__);
        if (app === null || app === void 0 ? void 0 : app.container) {
            return invokePrototypeMethod(
                app,
                rawMethod,
                parent,
                handleNewNode(parent, newChild, app, source),
                passiveChild && getMappingNode(passiveChild)
            );
        } else if (rawMethod === globalEnv.rawAppend || rawMethod === globalEnv.rawPrepend) {
            return rawMethod.call(parent, newChild);
        }
        return rawMethod.call(parent, newChild, passiveChild);
    } else if (rawMethod === globalEnv.rawAppend || rawMethod === globalEnv.rawPrepend) {
        // const appName = newChild.__MINI_APP_NAME__;
        if (!(newChild instanceof Node) && appName) {
            const app = appInstanceMap.get(appName);
            if (app === null || app === void 0 ? void 0 : app.container) {
                if (parent === document.head) {
                    return rawMethod.call(app.container.querySelector("mini-app-head"), newChild);
                } else if (parent === document.body) {
                    return rawMethod.call(app.container.querySelector("mini-app-body"), newChild);
                }
            }
        }
        return rawMethod.call(parent, newChild);
    }
    return rawMethod.call(parent, newChild, passiveChild);
}
/**
 * Rewrite element prototype method
 */
export function patchElementPrototypeMethods() {
    // patchDocument();
    // Rewrite setAttribute
    Element.prototype.setAttribute = function setAttribute(key, value) {
        if (/^micro-app(-\S+)?/i.test(this.tagName) && key === "data") {
            if (isPlainObject(value)) {
                const cloneValue = {};
                Object.getOwnPropertyNames(value).forEach(propertyKey => {
                    if (!(isString(propertyKey) && propertyKey.indexOf("__") === 0)) {
                        //
                        cloneValue[propertyKey] = value[propertyKey];
                    }
                });
                this.data = cloneValue;
            } else if (value !== "[object Object]") {
                logWarn("property data must be an object", this.getAttribute("name"));
            }
        } else if (
            ((key === "src" && /^(img|script)$/i.test(this.tagName)) ||
                (key === "href" && /^link$/i.test(this.tagName))) &&
            this.__MINI_APP_NAME__ &&
            appInstanceMap.has(this.__MINI_APP_NAME__)
        ) {
            const app = appInstanceMap.get(this.__MINI_APP_NAME__);
            globalEnv.rawSetAttribute.call(this, key, CompletionPath(value, app.url));
        } else {
            globalEnv.rawSetAttribute.call(this, key, value);
        }
    };
    // prototype methods of add element
    Node.prototype.appendChild = function appendChild(newChild) {
        return commonElementHander(this, newChild, null, globalEnv.rawAppendChild, "appendChild");
    };
    Node.prototype.insertBefore = function insertBefore(newChild, refChild) {
        return commonElementHander(this, newChild, refChild, globalEnv.rawInsertBefore, "insertBefore");
    };
    Node.prototype.replaceChild = function replaceChild(newChild, oldChild) {
        return commonElementHander(this, newChild, oldChild, globalEnv.rawReplaceChild, "replaceChild");
    };
    Element.prototype.append = function append(...nodes) {
        let i = 0;
        const length = nodes.length;
        while (i < length) {
            commonElementHander(this, nodes[i], null, globalEnv.rawAppend, "append");
            i++;
        }
    };
    Element.prototype.prepend = function prepend(...nodes) {
        let i = nodes.length;
        while (i > 0) {
            commonElementHander(this, nodes[i - 1], null, globalEnv.rawPrepend, "prepend");
            i--;
        }
    };
    // 删除元素的原型方法
    Node.prototype.removeChild = function removeChild(oldChild) {
        if (oldChild === null || oldChild === void 0 ? void 0 : oldChild.__MINI_APP_NAME__) {
            const app = appInstanceMap.get(oldChild.__MINI_APP_NAME__);
            if (app === null || app === void 0 ? void 0 : app.container) {
                return invokePrototypeMethod(app, globalEnv.rawRemoveChild, this, getMappingNode(oldChild));
            }
            return globalEnv.rawRemoveChild.call(this, oldChild);
        }
        return globalEnv.rawRemoveChild.call(this, oldChild);
    };
}
/**
 * 在微应用程序中标记新创建的元素 在dom上做标记__MINI_APP_NAME__
 * @param element new element
 */
// function markElement (element) {
//   const appName = getCurrentAppName()
//   appName && (element.__MINI_APP_NAME__ = appName)
//   return element
// }
// methods of document 1、创建元素的方法添加标记__MINI_APP_NAME__ 2、获取属性的方法 从 appInstanceMap.get(appName).container中进行querySelector(selectors) 注意这里改动的是基座运行环境下的dom方法
// function patchDocument () {
//   const rawDocument = globalEnv.rawDocument
//   // create element
//   Document.prototype.createElement = function createElement (tagName, options) {
//     const element = globalEnv.rawCreateElement.call(this, tagName, options)
//     return markElement(element)
//   }
//   Document.prototype.createElementNS = function createElementNS (namespaceURI, name, options) {
//     const element = globalEnv.rawCreateElementNS.call(this, namespaceURI, name, options)
//     return markElement(element)
//   }
//   Document.prototype.createDocumentFragment = function createDocumentFragment () {
//     const element = globalEnv.rawCreateDocumentFragment.call(this)
//     return markElement(element)
//   }
//   // query element
//   function querySelector (selectors) {
//     const appName = getCurrentAppName()
//     if (
//       !appName ||
//             !selectors ||
//             isUniqueElement(selectors) ||
//             // see https://github.com/micro-zoe/micro-app/issues/56
//             rawDocument !== this
//     ) {
//       return globalEnv.rawQuerySelector.call(this, selectors)
//     }
//     try {
//         // 获取new CreateApp实例
//       return appInstanceMap.get(appName).container.querySelector(selectors)
//     } catch (error) {
//       return null;
//     }
//   }
//   function querySelectorAll (selectors) {
//     const appName = getCurrentAppName()
//     if (!appName || !selectors || isUniqueElement(selectors) || rawDocument !== this) {
//       return globalEnv.rawQuerySelectorAll.call(this, selectors)
//     }
//     try {
//       // 获取new CreateApp实例
//       return appInstanceMap.get(appName).container.querySelectorAll(selectors)
//     } catch (error) {
//       return null;
//     }
//   }
//   Document.prototype.querySelector = querySelector
//   Document.prototype.querySelectorAll = querySelectorAll
//   Document.prototype.getElementById = function getElementById (key) {
//     // console.log('Document.prototype.getElementById:')
//     // console.log(getCurrentAppName())
//     // console.log(isInvalidQuerySelectorKey(key))
//     // 如果在基座应用中
//     if (!getCurrentAppName() || isInvalidQuerySelectorKey(key)) {
//       return globalEnv.rawGetElementById.call(this, key)
//     }
//     // 如果在子应用中
//     try {
//       return querySelector.call(this, `#${key}`)
//     } catch (_a) {
//       // 兜底
//       return globalEnv.rawGetElementById.call(this, key)
//     }
//   }
//   Document.prototype.getElementsByClassName = function getElementsByClassName (key) {
//     if (!getCurrentAppName() || isInvalidQuerySelectorKey(key)) {
//       return globalEnv.rawGetElementsByClassName.call(this, key)
//     }
//     try {
//       return querySelectorAll.call(this, `.${key}`)
//     } catch (_a) {
//       return globalEnv.rawGetElementsByClassName.call(this, key)
//     }
//   }
//   Document.prototype.getElementsByTagName = function getElementsByTagName (key) {
//     const appName = getCurrentAppName()
//     if (
//       !appName ||
//       isUniqueElement(key) ||
//       isInvalidQuerySelectorKey(key) ||
//       (!appInstanceMap.get(appName).inline && /^script$/i.test(key))
//     ) {
//       return globalEnv.rawGetElementsByTagName.call(this, key)
//     }
//     try {
//       return querySelectorAll.call(this, key)
//     } catch (_b) {
//       return globalEnv.rawGetElementsByTagName.call(this, key)
//     }
//   }
//   Document.prototype.getElementsByName = function getElementsByName (key) {
//     if (!getCurrentAppName() || isInvalidQuerySelectorKey(key)) {
//       return globalEnv.rawGetElementsByName.call(this, key)
//     }
//     try {
//       return querySelectorAll.call(this, `[name=${key}]`)
//     } catch (_a) {
//       return globalEnv.rawGetElementsByName.call(this, key)
//     }
//   }
// }
// function releasePatchDocument () {
//   Document.prototype.createElement = globalEnv.rawCreateElement
//   Document.prototype.createElementNS = globalEnv.rawCreateElementNS
//   Document.prototype.createDocumentFragment = globalEnv.rawCreateDocumentFragment
//   Document.prototype.querySelector = globalEnv.rawQuerySelector
//   Document.prototype.querySelectorAll = globalEnv.rawQuerySelectorAll
//   Document.prototype.getElementById = globalEnv.rawGetElementById
//   Document.prototype.getElementsByClassName = globalEnv.rawGetElementsByClassName
//   Document.prototype.getElementsByTagName = globalEnv.rawGetElementsByTagName
//   Document.prototype.getElementsByName = globalEnv.rawGetElementsByName
// }
// release patch 当前不存在任何elementInstanceMap的时候，释放补丁
export function releasePatches() {
    setCurrentAppName(null);
    //   releasePatchDocument()
    Element.prototype.setAttribute = globalEnv.rawSetAttribute;
    Node.prototype.appendChild = globalEnv.rawAppendChild;
    Node.prototype.insertBefore = globalEnv.rawInsertBefore;
    Node.prototype.replaceChild = globalEnv.rawReplaceChild;
    Node.prototype.removeChild = globalEnv.rawRemoveChild;
    Element.prototype.append = globalEnv.rawAppend;
    Element.prototype.prepend = globalEnv.rawPrepend;
}
// 设置样式 mini-app-head and mini-app-body
let hasRejectMicroAppStyle = false;
export function rejectMicroAppStyle() {
    if (!hasRejectMicroAppStyle) {
        hasRejectMicroAppStyle = true;
        const style = pureCreateElement("style");
        style.setAttribute("type", "text/css");
        /** 即注入
         * micro-app, mini-app-body { display: block; border: 1px solid; }
         * mini-app-head { display: none; }
         */
        style.textContent = `\n${microApp.tagName}, mini-app-body { display: block; } \nmini-app-head { display: none; }`;
        globalEnv.rawDocument.head.appendChild(style);
    }
}

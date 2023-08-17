import { fetchSource } from "./fetch";
import { logError, CompletionPath, pureCreateElement } from "../libs/utils";
import { extractLinkFromHtml, fetchLinksFromHtml } from "./links";
import { extractScriptElement, fetchScriptsFromHtml } from "./scripts";
import scopedCSS from "./scoped_css";
/**
 * 转换HTML字符串到dom
 * @param str string dom
 */
function getWrapElement(str) {
    const wrapDiv = pureCreateElement("div");
    wrapDiv.innerHTML = str;
    return wrapDiv;
}
/**
 * 递归地处理每个子元素
 * 判断每一个子元素是何种类型的dom，分别进行不同的处理，
 * 举例1：是<style> 进行 scopecss 样式隔离
 * 举例2：是<link> 获取属性href并添加到 app.source.links
 * 举例3：是<script> app.source.scripts.set(src, info)
 * @param parent parent element
 * @param {CreateApp} app - instance of CreateApp
 * @param microAppHead mini-app-head element
 */
function flatChildren(parent, app, microAppHead) {
    const children = Array.from(parent.children);
    children.length &&
        children.forEach(child => {
            flatChildren(child, app, microAppHead);
        });
    for (const dom of children) {
        if (dom instanceof HTMLLinkElement) {
            if (dom.hasAttribute("exclude")) {
                parent.replaceChild(
                    document.createComment("link element with exclude attribute ignored by micro-app"),
                    dom
                );
            } else if (app.scopecss && !dom.hasAttribute("ignore")) {
                extractLinkFromHtml(dom, parent, app, microAppHead);
            } else if (dom.hasAttribute("href")) {
                dom.setAttribute("href", CompletionPath(dom.getAttribute("href"), app.url));
            }
        } else if (dom instanceof HTMLStyleElement) {
            if (dom.hasAttribute("exclude")) {
                parent.replaceChild(
                    document.createComment("style element with exclude attribute ignored by micro-app"),
                    dom
                );
            } else if (app.scopecss && !dom.hasAttribute("ignore")) {
                microAppHead.appendChild(scopedCSS(dom, app.name));
            }
        } else if (dom instanceof HTMLScriptElement) {
            // 内部 进行app.source.scripts.set
            extractScriptElement(dom, parent, app);
        } else if (dom instanceof HTMLMetaElement || dom instanceof HTMLTitleElement) {
            parent.removeChild(dom);
        } else if (dom instanceof HTMLImageElement && dom.hasAttribute("src")) {
            dom.setAttribute("src", CompletionPath(dom.getAttribute("src"), app.url));
        }
    }
}
/**
 * 提取链接和脚本，绑定样式和范围
 * @param htmlStr html string
 * @param {CreateApp} app - instance of CreateApp
 */
function extractSourceDom(htmlStr, app) {
    // 创建dom对象
    const wrapElement = getWrapElement(htmlStr);
    const microAppHead = wrapElement.querySelector("mini-app-head");
    const microAppBody = wrapElement.querySelector("mini-app-body");
    if (!microAppHead || !microAppBody) {
        const msg = `element ${microAppHead ? "body" : "head"} is missing`;
        app.onerror(new Error(msg));
        console.log(new Error(msg));
        return logError(msg, app.name);
    }
    flatChildren(wrapElement, app, microAppHead);
    // 获取到link和script脚本属性信息后，注意到这里还没有获取link和script远程资源
      if (app.source.links.size) {
        // 获取远程link资源
        fetchLinksFromHtml(wrapElement, app, microAppHead)
      } else {
        app.onLoad(wrapElement)
      }

    //   if (app.source.scripts.size) {
    //     // 获取远程的js资源
    //     fetchScriptsFromHtml(wrapElement, app)
    //   } else {
    //     app.onLoad(wrapElement)
    //   }
}
/**
 * 获取和格式化 html
 * @param {CreateApp} app - instance of CreateApp
 */
export default function extractHtml(app) {
    // 请求获取html资源 并将 <head> =><mini-app-head> ,<body> =><mini-app-body>
    fetchSource(app.url, app.name, { cache: "no-cache" })
        .then(htmlStr => {
            if (!htmlStr) {
                const msg = "html is empty, please check in detail";
                app.onerror(new Error(msg));
                return logError(msg, app.name);
            }
            htmlStr = htmlStr
                .replace(/<head[^>]*>[\s\S]*?<\/head>/i, match => {
                    return match.replace(/<head/i, "<mini-app-head").replace(/<\/head>/i, "</mini-app-head>");
                })
                .replace(/<body[^>]*>[\s\S]*?<\/body>/i, match => {
                    return match.replace(/<body/i, "<mini-app-body").replace(/<\/body>/i, "</mini-app-body>");
                });
            // 提取组装为dom结构
            extractSourceDom(htmlStr, app);
        })
        .catch(e => {
            logError(`Failed to fetch data from ${app.url}, micro-app stop rendering`, app.name, e);
            app.onLoadError(e);
        });
}

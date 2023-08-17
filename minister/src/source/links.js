import { fetchSource } from "./fetch";
import { CompletionPath, promiseStream, pureCreateElement, defer, logError } from "../libs/utils";
import scopedCSS from "./scoped_css";
import { dispatchOnLoadEvent, dispatchOnErrorEvent } from "./load_event";
// Global links, reuse across apps
export const globalLinks = new Map();
/**
 * Extract link elements
 * @param link link element
 * @param parent parent element of link
 * @param {CreateApp} app - instance of CreateApp
 * @param microAppHead mini-app-head element
 * @param isDynamic dynamic insert
 */
export function extractLinkFromHtml(link, parent, app, microAppHead, isDynamic = false) {
    const rel = link.getAttribute("rel");
    let href = link.getAttribute("href");
    let replaceComment = null;
    if (rel === "stylesheet" && href) {
        href = CompletionPath(href, app.url);
        if (!isDynamic) {
            replaceComment = document.createComment(
                `link element with href=${href} move to mini-app-head as style element`
            );
            const placeholderComment = document.createComment(`placeholder for link with href=${href}`);
            // all style elements insert into microAppHead
            microAppHead.appendChild(placeholderComment);
            app.source.links.set(href, {
                code: "",
                placeholder: placeholderComment,
                isGlobal: link.hasAttribute("global"),
            });
        } else {
            return {
                url: href,
                info: {
                    code: "",
                    isGlobal: link.hasAttribute("global"),
                },
            };
        }
    } else if (rel && ["prefetch", "preload", "prerender", "icon", "apple-touch-icon"].includes(rel)) {
        // preload prefetch  icon ....
        if (isDynamic) {
            replaceComment = document.createComment(
                `link element with rel=${rel}${href ? " & href=" + href : ""} removed by micro-app`
            );
        } else {
            parent.removeChild(link);
        }
    } else if (href) {
        // dns-prefetch preconnect modulepreload search ....
        link.setAttribute("href", CompletionPath(href, app.url));
    }
    if (isDynamic) {
        return { replaceComment };
    } else if (replaceComment) {
        return parent.replaceChild(replaceComment, link);
    }
}
/**
 * 获取链接远程资源
 * @param wrapElement htmlDom
 * @param {CreateApp} app - instance of CreateApp
 * @param microAppHead mini-app-head
 */
export function fetchLinksFromHtml(wrapElement, app, microAppHead) {
    const linkEntries = Array.from(app.source.links.entries());
    const fetchLinkPromise = [];
    for (const [url] of linkEntries) {
        const globalLinkCode = globalLinks.get(url);
        globalLinkCode ? fetchLinkPromise.push(globalLinkCode) : fetchLinkPromise.push(fetchSource(url, app.name));
    }
    promiseStream(
        fetchLinkPromise,
        res => {
            fetchLinkSuccess(linkEntries[res.index][0], linkEntries[res.index][1], res.data, microAppHead, app);
        },
        err => {
            logError(err, app.name);
        },
        () => {
            app.onLoad(wrapElement);
        }
    );
}
/**
 * 获取链接成功回调处理，用样式标签替换占位符
 * @param url resource address
 * @param info resource link info
 * @param data code
 * @param microAppHead mini-app-head
 * @param {CreateApp} app - instance of CreateApp
 */
export function fetchLinkSuccess(url, info, data, microAppHead, app) {
    if (info.isGlobal && !globalLinks.has(url)) {
        globalLinks.set(url, data);
    }
    const styleLink = pureCreateElement("style");
    styleLink.textContent = data;
    styleLink.linkpath = url;
    microAppHead.replaceChild(scopedCSS(styleLink, app.name), info.placeholder);
    info.placeholder = null;
    info.code = data;
}
/**
 * 从动态链接中获取CSS
 * @param url link address
 * @param info info
 * @param {CreateApp} app - instance of CreateApp
 * @param originLink origin link element
 * @param replaceStyle style element which replaced origin link
 */
export function foramtDynamicLink(url, info, app, originLink, replaceStyle) {
    if (app.source.links.has(url)) {
        replaceStyle.textContent = app.source.links.get(url).code;
        scopedCSS(replaceStyle, app.name);
        defer(() => dispatchOnLoadEvent(originLink));
        return;
    }
    if (globalLinks.has(url)) {
        const code = globalLinks.get(url);
        info.code = code;
        app.source.links.set(url, info);
        replaceStyle.textContent = code;
        scopedCSS(replaceStyle, app.name);
        defer(() => dispatchOnLoadEvent(originLink));
        return;
    }
    fetchSource(url, app.name)
        .then(data => {
            info.code = data;
            app.source.links.set(url, info);
            if (info.isGlobal) {
                globalLinks.set(url, data);
            }
            replaceStyle.textContent = data;
            scopedCSS(replaceStyle, app.name);
            dispatchOnLoadEvent(originLink);
        })
        .catch(err => {
            logError(err, app.name);
            dispatchOnErrorEvent(originLink);
        });
}

import { appInstanceMap } from "../create_app";
import { CompletionPath, isSafari, pureCreateElement, getLinkFileDir } from "../libs/utils";
import microApp from "../minister";
import globalEnv from "../libs/global_env";
// https://developer.mozilla.org/zh-CN/docs/Web/API/CSSRule
const CSSRuleType = {
    STYLE_RULE: 1,
    MEDIA_RULE: 4,
    SUPPORTS_RULE: 12,
};
/**
 * Bind css scope 绑定css隔离前缀 处理字符串
 * Special case:
 * 1. html-abc | abc-html
 * 2. html body.abc
 * 3. abchtml | htmlabc | abcbody | bodyabc
 * 4. html + body | html > body | html.body | html[name=xx] | body[name=xx]
 * 5. xxx, html xxx, body xxx
 *
 * TODO: BUG  待解决
  .test-b {
    border: 1px solid var(--color-a);
    border-bottom-color: var(--color-b);
  }
 */
function scopedStyleRule(rule, prefix) {
    const { selectorText, cssText } = rule;
    if (/^((html[\s>~,]+body)|(html|body|:root))$/.test(selectorText)) {
        return cssText.replace(/^((html[\s>~,]+body)|(html|body|:root))/, prefix);
    } else if (selectorText === "*") {
        return cssText.replace("*", `${prefix} *`);
    }
    const builtInRootSelectorRE = /(^|\s+)((html[\s>~]+body)|(html|body|:root))(?=[\s>~]+|$)/;
    return cssText.replace(/^[\s\S]+{/, selectors => {
        return selectors.replace(/(^|,)([^,]+)/g, (all, $1, $2) => {
            if (builtInRootSelectorRE.test($2)) {
                // body[name=xx]|body.xx|body#xx etc. do not need to handle
                return all.replace(builtInRootSelectorRE, prefix);
            }
            return `${$1} ${prefix} ${$2.replace(/^\s*/, "")}`;
        });
    });
}
/**
 * 静态资源地址补全
 * @param cssText css content
 * @param baseURI domain name
 * @param textContent origin content
 * @param linkpath link resource address, if it is the style converted from link, it will have linkpath
 */
function scopedHost(cssText, baseURI, textContent, linkpath) {
    return cssText.replace(/url\(["']?([^)"']+)["']?\)/gm, (all, $1) => {
        if (/^(data|blob):/.test($1)) {
            return all;
        } else if (/^(https?:)?\/\//.test($1)) {
            if (isSafari()) {
                const purePath = $1.replace(/^https?:/, "");
                if (textContent.indexOf(purePath) === -1) {
                    $1 = $1.replace(window.location.origin, "");
                } else {
                    return all;
                }
            } else {
                return all;
            }
        }
        // ./a/b.png  ../a/b.png  a/b.png
        if (/^((\.\.?\/)|[^/])/.test($1) && linkpath) {
            baseURI = getLinkFileDir(linkpath);
        }
        return `url("${CompletionPath($1, baseURI)}")`;
    });
}
// 处理媒体和支持
function scopedPackRule(rule, prefix, packName) {
    const result = scopedRule(Array.from(rule.cssRules), prefix);
    return `@${packName} ${rule.conditionText} {${result}}`;
}
/**
 * 处理每个cssrule
 * @param rules cssRule
 * @param prefix prefix as micro-app[name=xxx]
 */
function scopedRule(rules, prefix) {
    let result = "";
    for (const rule of rules) {
        switch (rule.type) {
            case CSSRuleType.STYLE_RULE:
                result += scopedStyleRule(rule, prefix);
                break;
            case CSSRuleType.MEDIA_RULE:
                result += scopedPackRule(rule, prefix, "media");
                break;
            case CSSRuleType.SUPPORTS_RULE:
                result += scopedPackRule(rule, prefix, "supports");
                break;
            default:
                result += rule.cssText;
                break;
        }
    }
    return result.replace(/^\s+/, "");
}
/**
 * 绑定CSS的常用方法
 */
function commonAction(templateStyle, styleElement, originContent, prefix, baseURI, linkpath) {
    // 将cssRules（CSSStyleRule对象）转换为数组
    const cssRules = templateStyle.sheet && templateStyle.sheet.cssRules;
    const rules = Array.from(cssRules || []);
    // 解析特殊的 属性值，如 background: #00FF00 url(bgimage.gif) no-repeat fixed top;
    let result = scopedHost(
        // 解析cssText和selectorText属性 添加前缀 并组装字符串
        scopedRule(rules, prefix),
        baseURI,
        originContent,
        linkpath
    );
    /**
     * Solve the problem of missing content quotes in some Safari browsers
     * docs: https://developer.mozilla.org/zh-CN/docs/Web/CSS/content
     * If there are still problems, it is recommended to use the attr()
     */
    if (isSafari()) {
        result = result.replace(/([;{]\s*content:\s*)([^\s"][^";}]*)/gm, (all, $1, $2) => {
            if ($2 === "none" || /^(url\()|(counter\()|(attr\()|(open-quote)|(close-quote)/.test($2)) {
                return all;
            }
            return `${$1}"${$2}"`;
        });
    }
    // Node 接口的 textContent 属性表示一个节点及其后代的文本内容。
    styleElement.textContent = result;
}
/**
 * scopedCSS 样式隔离 css
 * @param styleElement target style element
 * @param appName app name
 */
export default function scopedCSS(styleElement, appName) {
    const app = appInstanceMap.get(appName);
    if (app === null || app === void 0 ? void 0 : app.scopecss) {
        const prefix = `${microApp.tagName}[name=${appName}]`;
        let templateStyle = globalEnv.templateStyle;
        // 没有就新建一个 <style id="">
        if (!templateStyle) {
            globalEnv.templateStyle = templateStyle = pureCreateElement("style");
            templateStyle.setAttribute("id", "micro-app-template-style");
            globalEnv.rawDocument.body.appendChild(templateStyle);
            // @see https://developer.mozilla.org/zh-CN/docs/Web/API/StyleSheet/disabled 用于决定样式表是否被禁用于文档。
            templateStyle.sheet.disabled = true;
        }
        if (styleElement.textContent) {
            templateStyle.textContent = styleElement.textContent;
            commonAction(templateStyle, styleElement, styleElement.textContent, prefix, app.url, styleElement.linkpath);
            templateStyle.textContent = "";
        } else {
            const observer = new MutationObserver(function () {
                observer.disconnect();
                // styled-component will not be processed temporarily
                if (
                    (!styleElement.textContent && styleElement.sheet.cssRules.length) ||
                    styleElement.hasAttribute("data-styled")
                ) {
                    return;
                }
                commonAction(
                    styleElement,
                    styleElement,
                    styleElement.textContent,
                    prefix,
                    app.url,
                    styleElement.linkpath
                );
            });
            // 给 <style>dom添加监听
            observer.observe(styleElement, { childList: true });
        }
    }
    return styleElement;
}

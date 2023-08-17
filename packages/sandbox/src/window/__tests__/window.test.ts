/**
 * @jest-environment jsdom
 */
import { describe, expect, test } from "@jest/globals";
import createWindowProxy from "../index";

function createApp(appName, url) {
    const rootElement = document.createElement("main");
    rootElement.setAttribute("id", appName);
    const header = document.createElement("mini-app-head");
    header.setAttribute('dta-tag', 'mini-app-head');
    rootElement.appendChild(header);
    rootElement.appendChild(document.createElement("mini-app-body"));
    document.body.appendChild(rootElement);
    const windowProxy = createWindowProxy({appName, url, rootElement});
    return { rootElement, windowProxy, appName };
}

function runScriptInSubApp(app, scriptStr) {
    window["window-" + app.appName] = app.windowProxy.proxyInstance;
    window["document-" + app.appName] = app.windowProxy.proxyInstance.document;
    (function (window, document) {
        const script = document.createElement("script");
        script.innerHTML = `(function (window, document) {` + scriptStr + `})(window["window-${app.appName}"], window["document-${app.appName}"])`;
        console.log(script, window, document, document.head);
        document.head.appendChild(script);
    })(app.windowProxy.proxyInstance, app.windowProxy.proxyInstance.document);
}

test("createWindowProxy", () => {
    const app1 = createApp("app1", "http://localhost:8080");
    runScriptInSubApp(app1, `console.log(document.querySelector("head").getAttribute("dta-tag"))`);
    console.log(document.documentElement.innerHTML);
});

import Sandbox from "@minister/sandbox-iframe";

fetch("/child.html")
    .then(res => res.text())
    .then(html => {
        const matched = html.match(/<script src="([^"]*)" .*><\/script>/);
        const src = matched[1];
        const innerScript = document.createElement("script");
        innerScript.type = "text/javascript";
        innerScript.id = "innerScript";
        innerScript.src = src;

        const appName = "test";
        window.addEventListener("popstate", event => {
            console.log("minister: parent-popstate", event);
            const newHash = new URL(event.newURL).hash || "#/";

        }, false);
        window.addEventListener("hashchange", event => {
            console.log("minister: parent-hashchange", event);
        }, false);
        const sandbox = new Sandbox({
            appName,
            url: "http://localhost:1234",
            hash: location.hash.replace(`#/${appName}`, "#"),
            rootElement: document.getElementById("root") as HTMLElement,
            scripts: [`<script src="${src}"></script>`],
            onReady: () => {},
            onHashChange: event => {
                const newHash = new URL(event.newURL).hash || "#/";
                history.replaceState(null, "", newHash.replace(/^#\//, "#/test/"));
                // 同步到主应用
            },
            onPopState: event => {
                // Logger.log("onPopState", event);
                // 同步到主应用
            },
        });
        // sandbox.execScript(innerScript);
    });
// document.addEventListener('DOMContentLoaded', function(){
//     alert('main DOMContentLoaded');
// });

// document.addEventListener('click', function(){
//     alert('main document click');
// });

// window.addEventListener("load", function(){
//     alert('main load');
// });

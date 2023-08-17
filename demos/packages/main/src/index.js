import React from 'react';
import ReactDOM, { render } from 'react-dom';
import minister from 'minister';
import { HashRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import ChildPage from './views/ChildPage';
import Order from './views/Order';
import MyDropdown from './views/MyDropdown.jsx';
import MyTrade from './views/MyTrade.jsx';
import Shop from './views/Shop';
import Plugin from './views/plugin';
import './index.css';
// 注意这里这样引用是使用了alias且注释了ModuleScopePlugin插件。
// ModuleScopePlugin插件: 限制src目录的（使用的额外的解析插件列表，使用ModuleScopePlugin限制自己编写的模块只能从src目录中引入）
// import microApp from "micro-app-origin/micro-app";

window.onload = function () {
    alert('onload');
};
window.addEventListener('load', function (e) {
    console.log(document.body);
});
window.addEventListener('Dom', function (e) {
    console.log(document.body);
});
// 提供给子应用公用的react版本 取决于父应用的react版本
window.React = React;
window.ReactDOM = ReactDOM;

function matchChildApp(url) {
    return true;
}

minister.start({
    tagName: 'mini-app',
    inline: true,
    shadowDOM: false,
    // 开启缓存
    destory: false,
    // 启用沙箱
    disableSandbox: false,
    // 全局的生命周期支持，即所有覆盖所有子应用
    lifeCycles: {
        // * created, beforemount, mounted, unmount, error
        created(e) {
            console.log('created');
        },
    },
    events: {
        onRedirect: (event) => {},
    },
    // cacheStrategy: "lru",
    // cacheCapacity: 1,
});

// 如需使用 history模式 ，直接将HashRouter替换为BrowserRouter [指南Tutorial](https://reactrouter.com/docs/en/v6/getting-started/tutorial)
const rootElement = document.getElementById('root');

render(
    <HashRouter>
        <Routes>
            <Route path="/" element={<App />} />
            <Route path="shop/*" element={<Shop />} />
            <Route path="plugin/*" element={<Plugin />} />
            <Route path="child/*" element={<ChildPage />} />
            <Route path="order/*" element={<Order />} />
            <Route path="dropdown/*" element={<MyDropdown />} />
            <Route path="trade/*" element={<MyTrade />} />
            <Route
                path="*"
                element={
                    <main style={{ padding: '1rem' }}>
                        <p>父应用未匹配到路由 There's nothing here!</p>
                    </main>
                }
            />
        </Routes>
    </HashRouter>,
    rootElement
);

// ReactDOM.createPortal(child, container)

// function createSubApp() {
//     const iframe = document.createElement("iframe");
//     const iframeHtml = `
// <html>
// <head>
// <title>子应用</title>
// </head>
// <body>
// <div id="app"></div>
// <script>
//     const rawAppend = Element.prototype.append;
//     Element.prototype.append = function() {
//         console.log('append');
//         rawAppend.apply(this, arguments);
//     }
//     console.log('window.parent', window.parent);
//     const app = document.createElement('div');
//     app.id = "app";
//     window.parent.document.body.append(app);
//     // app.append(document.createElement('div'));
//     // window.parent.document.body.querySelector('#app').append(document.createTextNode('在父应用中创建的文本节点'));
//     // app.querySelector('div').append(document.createTextNode('在子应用中创建的文本节点'));
// </script>
// </body>
// </html>
// `;
//     iframe.src = iframeHtml;
//     iframe.style.width = "100%";
//     iframe.style.height = "100%";
//     iframe.style.border = "none";
//     iframe.style.background = "#fff";
//     iframe.onload = function () {
//         const iframeDocument = iframe.contentDocument;
//         const iframeApp = iframeDocument.getElementById("app");
//         iframeApp.append(document.createTextNode('在子应用中创建的文本节点'));
//     };
//     document.body.appendChild(iframe);
// }

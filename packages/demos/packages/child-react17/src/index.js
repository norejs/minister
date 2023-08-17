import { render } from "react-dom";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AliveScope, KeepAlive } from "./react-keep-alive";

import Expenses, { Item } from "./views/Expenses.jsx";
import Invoices from "./views/Invoices.jsx";
import Invoice from "./views/Invoice.jsx";
import App from "./App";

import "./index.css";

// 如需使用 history模式 ，直接将HashRouter替换为BrowserRouter [指南Tutorial](https://reactrouter.com/docs/en/v6/getting-started/tutorial)
const rootElement = document.getElementById("root");

window.__MINI_APP_BASE_ROUTE__ = "/child";

render(
    // basename={window.__MINI_APP_BASE_ROUTE__ || "/"}
    <HashRouter basename={window.__MINI_APP__BASE_URL__ || "/"}>
        <Routes>
            <Route path="/" element={<App />}>
                <Route path="expenses/*" element={<Expenses />} />
                <Route exact path={`expenses/item/:id`} element={<Item />} />

                <Route path="invoices" element={<Invoices />}>
                    <Route path=":invoiceId" element={<Invoice />} />
                </Route>
                <Route
                    path="*"
                    element={
                        <main style={{ padding: "1rem" }}>
                            <p>子应用未匹配到路由 There's nothing here!</p>
                        </main>
                    }
                />
            </Route>
        </Routes>
    </HashRouter>,
    rootElement
);

window.addEventListener("unmount", function(e) {
    // 执行卸载相关操作
    console.log("我检测到自己被卸载了", e);
});
// window.addEventListener("hashchange", function(e) {
//     // debugger;
// }); 
// window.addEventListener("popstate", function(e) {
//     console.log("popstate", e);
//     // debugger;
// });
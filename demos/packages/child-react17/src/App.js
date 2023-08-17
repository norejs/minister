import { Link, Outlet } from "react-router-dom";

import "./App.css";

function App() {
    const jsx = (
        <div style={{ border: "1px solid" }}>
            <h1>我是子应用demoChildApp，使用react17</h1>
            <div className="css-conflict">测试样式隔离</div>
            <nav
                style={{
                    borderBottom: "solid 1px",
                    paddingBottom: "1rem",
                }}
            >
                <Link to="/home">Home</Link>
                <Link to="/invoices">Invoices</Link> | <Link to="/expenses">Expenses</Link> |{" "}
            </nav>
            <Outlet />
        </div>
    );
    return jsx;
}
setTimeout(() => {
    window.location.hash = "#/test";
}, 2000);
// 子应用卸载

export default App;

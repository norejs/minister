import { Link } from "react-router-dom";

import "./App.css";

function App() {
  return (
    <div>
      <h2>我是父应用，使用react</h2>
      <nav
        style={{
          borderBottom: "solid 1px",
          paddingBottom: "1rem",
        }}
      >
        <Link to="/child">to child</Link>
        <br></br>
        <Link to="/shop">加载子应用/shop</Link>
        <br></br>
        <Link to="/dropdown">加载父应用的组件dropDown</Link>
        <br></br>
        <Link to="/trade">加载子应用mall-trade的代码</Link>
        <br></br>
        <Link to="/order">加载子应用order的代码</Link>
        {/* <br></br> */}
        {/* <Link to="/shop/">加载shop应用</Link> */}
        {/* <Link to="/child/expenses">加载子应用</Link> */}
      </nav>
      {/*<Outlet />*/}
    </div>
  );
}

export default App;

import React from 'react';
import { Link } from 'react-router-dom';
export default function Home() {
    return (
        <div>
            <Link to="/child">to child</Link>
            <br></br>
            <Link to="/shop">加载子应用/shop</Link>
            <br></br>
            <Link to="/dropdown">加载父应用的组件dropDown</Link>
        </div>
    );
}

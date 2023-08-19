import { Link, Outlet } from 'react-router-dom';
import { useRef, useEffect } from 'react';
import './App.css';
import LocationTests from './tests/LocationTests';
import DomTests from './tests/DomTests';
import HistoryTests from './tests/HistoryTests';

function App() {
    return (
        <div style={{ border: '1px solid' }}>
            <h1>我是子应用demoChildApp，使用react17</h1>
            <div className="css-conflict">测试样式隔离</div>
            <nav
                style={{
                    borderBottom: 'solid 1px',
                    paddingBottom: '1rem',
                }}
            >
                <Link to="/">Parent</Link>
            </nav>
            <LocationTests />
            <DomTests />
            <HistoryTests />
            <Outlet />
        </div>
    );
}
export default App;

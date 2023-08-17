import React from 'react';
import { HashRouter, Routes ,Route} from 'react-router-dom';
import Home from './Home';
import ChildPage from './pages/Child'


function App() {
    return <HashRouter>
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="child/*" element={<ChildPage />} />
            <Route
                path="*"
                element={
                    <main style={{ padding: '1rem' }}>
                        <p>父应用未匹配到路由 There's nothing here!</p>
                    </main>
                }
            />
        </Routes>
    </HashRouter>;
}

export default <App />;

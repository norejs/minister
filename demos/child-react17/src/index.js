import { render } from 'react-dom';
import { HashRouter, Routes, Route } from 'react-router-dom';

import LocationView from './views/LocationView';
import App from './App';

import './index.css';

// 如需使用 history模式 ，直接将HashRouter替换为BrowserRouter [指南Tutorial](https://reactrouter.com/docs/en/v6/getting-started/tutorial)
const rootElement = document.getElementById('root');
console.log(window.location.hash);
render(
    <HashRouter>
        <Routes>
            <Route path="/" element={<App />}></Route>
            <Route path="/location" element={<LocationView />}></Route>
        </Routes>
    </HashRouter>,
    rootElement
);

window.addEventListener('unmount', function (e) {
    // 执行卸载相关操作
    console.log('我检测到自己被卸载了', e);
});
// window.addEventListener("hashchange", function(e) {
//     // debugger;
// });
// window.addEventListener("popstate", function(e) {
//     console.log("popstate", e);
//     // debugger;
// });

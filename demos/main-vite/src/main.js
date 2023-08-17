import { createRoot } from 'react-dom/client';
import app from './App';
import minister from "minister";
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

const root = document.getElementById('root');

createRoot(root).render(app);

/** @jsxRuntime classic */
/** @jsx jsxCustomEvent */
import jsxCustomEvent from "minister/polyfill/jsx-custom-event";
// import { useRef } from "react";

export default function Plugin() {
    // 注意 ref={myRef} 会被二次处理
    // const myRef = useRef();
    // console.log("myRef:", myRef);
    const host = window.location.host;
    return (
        <main>
            {/* <h4>子应用demoChildApp页面展示如下：</h4> */}
            {/* <div className="css-conflict">测试样式隔离</div> */}
            {/* // name(必传)：应用名称 */}
            {/* // url(必传)：应用的html地址 */}
            {/* // baseroute(可选)：基座应用分配给子应用的基础路由，就是上面的my-page */}
            <mini-app
                baseroute="/plugin"
                name="plugin"
                url={`https://${host}/yao-h5/?app=PAJK`}
                onUnmount={e => console.log(" 子应用demoChildApp 被卸载 onUnmount", e)}
                onCreated={e => console.log("子应用demoChildApp micro-app元素被创建 onCreated", e)}
                onBeforemount={() => console.log("子应用demoChildApp 即将被渲染，只在初始化时执行一次 onBeforemount")}
                onMounted={() => console.log("子应用demoChildApp 已经渲染完成，只在初始化时执行一次 onMounted")}
                onAfterhidden={() => console.log("子应用demoChildApp keepalive: 已隐藏 onAfterhidden")}
                onBeforeshow={() => console.log("子应用demoChildApp 即将重新渲染，初始化时不执行 onBeforeshow")}
                onAftershow={() => console.log("子应用demoChildApp 已经重新渲染，初始化时不执行 onAftershow")}
                onError={() => console.log("子应用demoChildApp 渲染出错 onError")}
                // keep-alive
                // ref={myRef}
            ></mini-app>
        </main>
    );
}

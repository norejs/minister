/** @jsxRuntime classic */
/** @jsx jsxCustomEvent */
import jsxCustomEvent from "minister/polyfill/jsx-custom-event";
import { useRef } from "react";

export default function Order() {
    // 注意 ref={myRef} 会被二次处理
    const myRef = useRef();
    // console.log("myRef:", myRef);

    return (
        <main >
            {/* // name(必传)：应用名称 */}
            {/* // url(必传)：应用的html地址 */}
            {/* // baseroute(可选)：基座应用分配给子应用的基础路由，就是上面的my-page */}
            <mini-app
                baseroute="/order"
                name="order"
                url="http://localhost:3001/"
                onUnmount={(e) => console.log("被卸载", e)}
                onCreated={(e) => console.log("minister元素被创建", e)}
                onBeforemount={() => console.log("即将被渲染，只在初始化时执行一次")}
                onMounted={() => console.log("已经渲染完成，只在初始化时执行一次")}
                onAfterhidden={() => console.log("keepalive: 已隐藏")}
                onBeforeshow={() => console.log("即将重新渲染，初始化时不执行")}
                onAftershow={() => console.log("已经重新渲染，初始化时不执行")}
                // onError={() => console.log("渲染出错")}
                keep-alive
                ref={myRef}
            ></mini-app>
        </main>
    );
}

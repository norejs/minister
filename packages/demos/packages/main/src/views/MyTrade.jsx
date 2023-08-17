/** @jsxRuntime classic */
/** @jsx jsxCustomEvent */
import jsxCustomEvent from "minister/polyfill/jsx-custom-event";

export default function MyTrade() {
  return (
    <main >
      {/* <h4>子应用trade页面展示如下：</h4> */}
      {/* <div className="css-conflict">测试样式隔离</div> */}
      {/* // name(必传)：应用名称 */}
      {/* // url(必传)：应用的html地址 */}
      {/* // baseroute(可选)：基座应用分配给子应用的基础路由，就是上面的my-page */}
      <mini-app
        baseroute='/trade'
        name="trade"
        url="http://localhost:3002/"
        onCreated={() => console.log("子应用mall-trade minister元素被创建")}
        onBeforemount={() => console.log("子应用mall-trade 即将被渲染")}
        onMounted={() => console.log("子应用mall-trade 已经渲染完成")}
        onUnmount={() => console.log(" 子应用mall-trade 被卸载")}
        onError={() => console.log("子应用mall-trade 渲染出错")}
      ></mini-app>
    </main>
  );
}

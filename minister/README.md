# micro-app-react

react 微前端框架 （使用 rollup 构建工具）

目前支持 react > 16.8.0

### 版本号说明：

-   主版本号：含有破坏性更新和新特性，不在发布周期内。
-   次版本号：每月发布一个带有新特性的向下兼容的版本。
-   修订版本号：日常 bugfix 更新。

### 兼容性
[custom-elements polyfill](https://github.com/webcomponents/polyfills/tree/master/packages/custom-elements)

### 开发方式；
node环境要求：
"engines": {
    "node": ">=10.15.0"
}

1. npm run build:watch , micro-app包打包：

rollup -watch 实时生成打包结果 配合 alisa 使用
```javascript
alias: {
    'micro-app/polyfill': path.join(__dirname, '../../../polyfill'),
    'micro-app': path.join(__dirname, '../../../lib/index.esm.js'),
  },
```
2. 启动demo父和子应用，已经集成在dev文件下, 依次执行下列命令
"dev:install": "bash ./dev-install.sh",
"dev:main": "cd dev/main/react17 && yarn start",
"dev:order": "cd dev/children/react16/order && yarn start",
"dev:trade": "cd dev/children/react16/trade && yarn start"

启动成功后，访问路由http://localhost:4000即可。

### 父子应用 hash 访问 示例：

http://localhost:4000/#/child/invoices/2003

/child 访问到是父应用的使用<micro-app name>的业务
http://localhost:4000/#/child/invoices/2003 访问到是加载子应用之后，子应用内的定义的 /child/invoices/2003

`注意 child/* 配置<Route path="child/*">，让父应用`

### 生命周期

micro-app 通过 CustomEvent 定义生命周期，在组件渲染过程中会触发相应的生命周期事件。

生命周期列表

1. created
   <micro-app>标签初始化后，加载资源前触发。

2. beforemount
   加载资源完成后，开始渲染之前触发。

3. mounted
   子应用渲染结束后触发。

4. unmount
   子应用卸载时触发。

5. error
   子应用渲染出错时触发，只有会导致渲染终止的错误才会触发此生命周期。

### 监听生命周期

React 中
因为 React 不支持自定义事件，所以我们需要引入一个 polyfill。

在<micro-app>标签所在的文件顶部添加 polyfill，注释也要复制。

```javascript
/** @jsxRuntime classic */
/** @jsx jsxCustomEvent */
import jsxCustomEvent from "micro-app/polyfill/jsx-custom-event";
```

#### 开始使用

```javascript
<micro-app
    name="xx"
    url="xx"
    onCreated={() => console.log("micro-app元素被创建")}
    onBeforemount={() => console.log("即将被渲染")}
    onMounted={() => console.log("已经渲染完成")}
    onUnmount={() => console.log("已经卸载")}
    onError={() => console.log("渲染出错")}
/>
```

### 全局监听

全局监听会在每个应用的生命周期执行时都会触发。

```javascript
import microApp from "micro-app";

microApp.start({
    lifeCycles: {
        created(e) {
            console.log("created");
        },
        beforemount(e) {
            console.log("beforemount");
        },
        mounted(e) {
            console.log("mounted");
        },
        unmount(e) {
            console.log("unmount");
        },
        error(e) {
            console.log("error");
        },
    },
});
```

### keepalive
目前支持子应用最后的状态的缓存  支持的是应用级别的缓存, 如需要支持组件级别的缓存 需要配合 @micro-app/AliveScope
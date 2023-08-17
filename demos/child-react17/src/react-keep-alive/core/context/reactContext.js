// import createContext from 'create-react-context'
import React from "react";

const createContext = React.createContext;

// 整个 KeepAlive 功能的上下文，将 KeepAlive 的组件藏于其 Provider 中，保证其不会被卸载
export const aliveScopeContext = createContext();
export const {
    // 整个 AliveScope 的上下文
    Provider: AliveScopeProvider,
    // 整个 AliveScope 的上下文
    Consumer: AliveScopeConsumer,
} = aliveScopeContext;

// KeepAlive 组件的上下文，实现缓存生命周期功能
export const aliveNodeContext = createContext();
export const {
    // KeepAlive 中包裹的组件的上下文，用于缓存生命周期功能
    Provider: AliveNodeProvider,
    // KeepAlive 中包裹的组件的上下文，用于缓存生命周期功能
    Consumer: AliveNodeConsumer,
} = aliveNodeContext;

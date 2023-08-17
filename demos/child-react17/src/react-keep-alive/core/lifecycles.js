/* eslint-disable react-hooks/rules-of-hooks */
import React, {
    Component,
    forwardRef,
    useEffect,
    useRef,
    useContext,
} from "react";
import hoistStatics from "hoist-non-react-statics";
import {
    get,
    run,
    nextTick,
} from "../utils";
import { isObject, isFunction, isUndefined } from "../helpers/is";

import { AliveNodeConsumer, aliveNodeContext } from "./context";

export const LIFECYCLE_ACTIVATE = "componentDidActivate";
export const LIFECYCLE_UNACTIVATE = "componentWillUnactivate";

// withActivation HOC 借用 AliveNodeConsumer 使得 WrappedComponent 可以捕获定义在 Keeper 中的 attach 方法等属性
// 并对 WrappedComponent 的 componentDidMount 生命周期做延时处理
export const withActivation = (WrappedComponent) => {
    class HOC extends Component {
        drop = null;

        componentWillUnmount() {
            run(this.drop);
        }

        render() {
            const { forwardedRef, ...props } = this.props;

            return (
                <AliveNodeConsumer>
                    {
                        (context = {}) => (
                            <WrappedComponent
                                // 回调类型的 ref 中，React 组件实例或者 HTML DOM 元素会被作为参数传入
                                // 此处 typeof ref === KeepAlive
                                ref={(ref) => {
                                    // TODO 此处拿不到 AliveNodeProvider 提供的 context 值
                                    const { attach } = context;
                                    if (
                                        [LIFECYCLE_ACTIVATE, LIFECYCLE_UNACTIVATE].every(
                                            (lifecycleName) => !isFunction(get(ref, lifecycleName)),
                                        )
                                    ) {
                                        return;
                                    }
                                    this.drop = run(attach, undefined, ref);

                                    // 以下保持 ref 功能
                                    if (isUndefined(forwardedRef)) {
                                        return;
                                    }

                                    if (isObject(forwardedRef) && "current" in forwardedRef) {
                                        forwardedRef.current = ref;
                                        return;
                                    }

                                    run(forwardedRef, undefined, ref);
                                }}
                                {...props}
                            />
                        )
                    }
                </AliveNodeConsumer>
            );
        }
    }

    // 由于 KeepAlive 内组件渲染与实际内容落后一个节拍
    // 将导致真实节点的 componentDidMount 无法及时获取到 KeepAlive 中内容的 ref 值
    // 此处对使用了 withActivation HOC 的组件 componentDidMount 做 nextTick 延时处理
    // 修复上述问题

    if (isFunction(WrappedComponent.prototype.componentDidMount)) {
        WrappedComponent.prototype._componentDidMount =
            WrappedComponent.prototype.componentDidMount;
        WrappedComponent.prototype.componentDidMount = function componentDidMount() {
            nextTick(() => WrappedComponent.prototype._componentDidMount.call(this));
        };
    }

    // hoistStatics: 将 WrappedComponent 上的 static 方法复制到 HOC 上
    // 处理 ref 转发
    if (isFunction(forwardRef)) {
        const ForwardedRefHOC = forwardRef((props, ref) => (
            <HOC {...props} forwardedRef={ref} />
        ));

        return hoistStatics(ForwardedRefHOC, WrappedComponent);
    } else {
        return hoistStatics(HOC, WrappedComponent);
    }
};

const useActivation = (funcName, func) => {
    // 兼容性判断
    if ([useRef, useContext, useEffect].some((fn) => !isFunction(fn))) {
        return;
    }

    const ctxValue = useContext(aliveNodeContext);

    // 未处于 KeepAlive 中
    if (!ctxValue) {
        return;
    }

    const { current: ref } = useRef({});
    const { attach } = ctxValue;

    ref[funcName] = func;
    ref.drop = attach(ref);

    useEffect(() => {
        return () => run(ref.drop);
    }, []);
};

export const useActivate = useActivation.bind(null, LIFECYCLE_ACTIVATE);
export const useUnactivate = useActivation.bind(null, LIFECYCLE_UNACTIVATE);

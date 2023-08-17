/* eslint-disable react-hooks/rules-of-hooks */
import React, { forwardRef, useContext } from "react";
import hoistStatics from "hoist-non-react-statics";
// import { get, isFunction, isUndefined } from 'szfe-tools'
import { get } from "../utils";
import { isFunction, isUndefined } from "../helpers/is";

import { Acceptor } from "./Bridge";
import NodeKey from "./NodeKey";
import { AliveScopeConsumer, useScopeContext } from "./context";

function controllerCherryPick(controller) {
    const {
        drop,
        dropScope,
        refresh,
        refreshScope,
        clear,
        getCachingNodes,
    } = controller;
    return { drop, dropScope, refresh, refreshScope, clear, getCachingNodes };
}

// 高阶组件，通过 context 传入在 AliveScope 中定义的 keep 方法和 children 等其他属性，并向下传递给 KeepAlive
export const expandKeepAlive = (KeepAlive) => {
    const renderContent = ({ idPrefix, helpers, props }) => {
        const isOutsideAliveScope = isUndefined(helpers);

        if (isOutsideAliveScope) {
            console.error("You should not use <KeepAlive /> outside a <AliveScope>");
        }

        return isOutsideAliveScope ? (
            get(props, "children", null)
        ) : (
            <NodeKey prefix={idPrefix} key={props._nk}>
                {
                    (id) => {
                        console.log("🐔fuck nodeKey", id);
                        return (
                            <Acceptor key={id} id={id}>
                                {(bridgeProps) => (
                                    <KeepAlive
                                        key={id}
                                        {...props}
                                        {...bridgeProps}
                                        id={id}
                                        _helpers={helpers}
                                    />
                                )}
                            </Acceptor>
                        );
                    }
                }
            </NodeKey>
        );
    };
    const HookExpand = ({ id: idPrefix, ...props }) => {
        return renderContent({ idPrefix, helpers: useScopeContext(), props });
    };

    const WithExpand = ({ id: idPrefix, ...props }) => {
        console.log("🐔render WithExpand", props);
        return (
            <AliveScopeConsumer>
                {(helpers) => renderContent({ idPrefix, helpers, props })}
            </AliveScopeConsumer>
        );
    };

    return isFunction(useContext) ? HookExpand : WithExpand;
};

const withAliveScope = (WrappedComponent) => {
    const renderContent = ({ helpers, props, forwardedRef }) => (
        <WrappedComponent {...props} {...helpers} ref={forwardedRef} />
    );

    const HookScope = ({ forwardedRef, ...props }) =>
        renderContent({
            helpers: controllerCherryPick(useScopeContext() || {}),
            props,
            forwardedRef,
        });

    const WithScope = ({ forwardedRef, ...props }) => (
        <AliveScopeConsumer>
            {(controller = {}) =>
                renderContent({
                    helpers: controllerCherryPick(controller),
                    props,
                    forwardedRef,
                })
            }
        </AliveScopeConsumer>
    );

    const HOCWithAliveScope = isFunction(useContext) ? HookScope : WithScope;

    if (isFunction(forwardRef)) {
        const ForwardedRefHOC = forwardRef((props, ref) => (
            <HOCWithAliveScope {...props} forwardedRef={ref} />
        ));

        return hoistStatics(ForwardedRefHOC, WrappedComponent);
    } else {
        return hoistStatics(HOCWithAliveScope, WrappedComponent);
    }
};

export const useAliveController = () => {
    if (!isFunction(useContext)) {
        return {};
    }

    const ctxValue = useScopeContext();

    if (!ctxValue) {
        return {};
    }

    return controllerCherryPick(ctxValue);
};

export default withAliveScope;

/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState, useContext, useEffect } from "react";
import { run, debounce } from "../../utils";
import { isFunction } from "../../helpers/is";
// import { run, debounce, isFunction } from 'szfe-tools'

import {
    aliveScopeContext,
    AliveScopeProvider as AliveScopeReactProvider,
    AliveScopeConsumer as AliveScopeReactConsumer,
    aliveNodeContext,
    AliveNodeProvider,
    AliveNodeConsumer,
} from "./reactContext";
import {
    eventBus as fakeContextEventBus,
    FakeScopeProvider,
    FakeScopeConsumer,
} from "./FakeScopeContext";

export const useScopeContext = () => {
    if (!isFunction(useContext)) {
        return {};
    }

    const scopeReactContext = useContext(aliveScopeContext);

    if (scopeReactContext) {
        return scopeReactContext;
    }

    const [context, setContext] = useState(FakeScopeProvider.currentContextValue);

    useEffect(() => {
        const updateListener = debounce(setContext);
        fakeContextEventBus.on("update", updateListener);
        return () => fakeContextEventBus.off("update", updateListener);
    }, []);

    return context;
};

// 在通过 React.createContext 创建的 context 基础上又套了一层 FakeScopeProvider
export const AliveScopeProvider = ({ children, ...props }) => {
    return (
        <AliveScopeReactProvider {...props}>
            <FakeScopeProvider {...props}>{children}</FakeScopeProvider>
        </AliveScopeReactProvider>
    );
};

export const AliveScopeConsumer = ({ children }) => (
    <AliveScopeReactConsumer>
        {(reactContext) =>
            !!reactContext ? (
                run(children, undefined, reactContext)
            ) : (
                <FakeScopeConsumer>{children}</FakeScopeConsumer>
            )
        }
    </AliveScopeReactConsumer>
);
export {
    aliveScopeContext,
    aliveNodeContext,
    AliveNodeProvider,
    AliveNodeConsumer,
};

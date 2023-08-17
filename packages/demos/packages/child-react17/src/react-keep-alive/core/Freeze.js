// Fork from react-freeze
// https://github.com/software-mansion/react-freeze/blob/main/src/index.tsx
import React, { Component, Suspense, Fragment } from "react";

// function Suspender({ freeze, children }) {
//   const promiseCache = useRef({}).current
//   if (freeze && !promiseCache.promise) {
//     promiseCache.promise = new Promise((resolve) => {
//       promiseCache.resolve = resolve
//     })
//     throw promiseCache.promise
//   } else if (freeze) {
//     throw promiseCache.promise
//   } else if (promiseCache.promise) {
//     promiseCache.resolve()
//     promiseCache.promise = undefined
//   }

//   return <Fragment>{children}</Fragment>
// }

class Suspender extends Component {
    promiseCache = {};

    // @see https://juejin.cn/post/6994674140825272334
    render() {
        const { freeze, children } = this.props;
        const { promiseCache } = this;

        // 如果没有命中缓存，则会抛出一个 promise 异常
        // 当抛出的 promise 完成后，会重新render
        if (freeze && !promiseCache.promise) {
            promiseCache.promise = new Promise((resolve) => {
                promiseCache.resolve = resolve;
            });
            throw promiseCache.promise;
        } else if (freeze) {
            throw promiseCache.promise;
        } else if (promiseCache.promise) {
            // 如果命中缓存，则直接 render
            promiseCache.resolve();
            promiseCache.promise = undefined;
        }

        return <Fragment>{children}</Fragment>;
    }
}

export default function Freeze({ freeze, children, placeholder = null }) {
    return (
        <Suspense fallback={placeholder}>
            <Suspender freeze={freeze}>{children}</Suspender>
        </Suspense>
    );
}

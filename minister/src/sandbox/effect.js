import { getCurrentAppName, setCurrentAppName, logWarn, isFunction, isBoundFunction } from '../libs/utils';
import { appInstanceMap } from '../create_app';
import globalEnv from '../libs/global_env';
// document.onclick binding list, the binding function of each application is unique
const documentClickListMap = new Map();
let hasRewriteDocumentOnClick = false;
/**
 * Rewrite document.onclick and execute it only once
 */
function overwriteDocumentOnClick() {
    hasRewriteDocumentOnClick = true;
    if (Object.getOwnPropertyDescriptor(document, 'onclick')) {
        return logWarn('Cannot redefine document property onclick');
    }
    const rawOnClick = document.onclick;
    document.onclick = null;
    let hasDocumentClickInited = false;
    function onClickHandler(e) {
        documentClickListMap.forEach((f) => {
            isFunction(f) && f.call(document, e);
        });
    }
    Object.defineProperty(document, 'onclick', {
        configurable: true,
        enumerable: true,
        get() {
            const appName = getCurrentAppName();
            return appName ? documentClickListMap.get(appName) : documentClickListMap.get('base');
        },
        set(f) {
            const appName = getCurrentAppName();
            if (appName) {
                documentClickListMap.set(appName, f);
            }
            else {
                documentClickListMap.set('base', f);
            }
            if (!hasDocumentClickInited && isFunction(f)) {
                hasDocumentClickInited = true;
                globalEnv.rawDocumentAddEventListener.call(globalEnv.rawDocument, 'click', onClickHandler, false);
            }
        }
    });
    rawOnClick && (document.onclick = rawOnClick);
}
/**
 * The document event is globally, we need to clear these event bindings when micro application unmounted
 */
const documentEventListenerMap = new Map();
export function effectDocumentEvent() {
    const { rawDocument, rawDocumentAddEventListener, rawDocumentRemoveEventListener, } = globalEnv;
    !hasRewriteDocumentOnClick && overwriteDocumentOnClick();
    document.addEventListener = function (type, listener, options) {
        const appName = getCurrentAppName();
        /**
         * ignore bound function of document event in umd mode, used to solve problem of react global events
         */
        if (appName && !(appInstanceMap.get(appName).umdMode && isBoundFunction(listener))) {
            const appListenersMap = documentEventListenerMap.get(appName);
            if (appListenersMap) {
                const appListenerList = appListenersMap.get(type);
                if (appListenerList) {
                    appListenerList.add(listener);
                }
                else {
                    appListenersMap.set(type, new Set([listener]));
                }
            }
            else {
                documentEventListenerMap.set(appName, new Map([[type, new Set([listener])]]));
            }
            listener && (listener.__MICRO_MARK_OPTIONS__ = options);
        }
        rawDocumentAddEventListener.call(rawDocument, type, listener, options);
    };
    document.removeEventListener = function (type, listener, options) {
        const appName = getCurrentAppName();
        if (appName && !(appInstanceMap.get(appName).umdMode && isBoundFunction(listener))) {
            const appListenersMap = documentEventListenerMap.get(appName);
            if (appListenersMap) {
                const appListenerList = appListenersMap.get(type);
                if ((appListenerList === null || appListenerList === void 0 ? void 0 : appListenerList.size) && appListenerList.has(listener)) {
                    appListenerList.delete(listener);
                }
            }
        }
        rawDocumentRemoveEventListener.call(rawDocument, type, listener, options);
    };
}
// Clear the document event agent
export function releaseEffectDocumentEvent() {
    document.addEventListener = globalEnv.rawDocumentAddEventListener;
    document.removeEventListener = globalEnv.rawDocumentRemoveEventListener;
}
// this events should be sent to the specified app
const formatEventList = ['unmount', 'appstate-change'];
/**
 * Format event name
 * @param type event name
 * @param microWindow micro window
 */
function formatEventType(type, microWindow) {
    if (formatEventList.includes(type)) {
        return `${type}-${microWindow.__MINI_APP_NAME__}`;
    }
    return type;
}
/**
 * Rewrite side-effect events
 * @param microWindow micro window
 */
export default function effect(microWindow) {
    const appName = microWindow.__MINI_APP_NAME__;
    const eventListenerMap = new Map();
    const intervalIdMap = new Map();
    const timeoutIdMap = new Map();
    const { rawWindow, rawDocument, rawWindowAddEventListener, rawWindowRemoveEventListener, rawSetInterval, rawSetTimeout, rawClearInterval, rawClearTimeout, rawDocumentRemoveEventListener, } = globalEnv;
    // listener may be null, e.g test-passive
    microWindow.addEventListener = function (type, listener, options) {
        type = formatEventType(type, microWindow);
        const listenerList = eventListenerMap.get(type);
        if (listenerList) {
            listenerList.add(listener);
        }
        else {
            eventListenerMap.set(type, new Set([listener]));
        }
        listener && (listener.__MICRO_MARK_OPTIONS__ = options);
        rawWindowAddEventListener.call(rawWindow, type, listener, options);
    };
    microWindow.removeEventListener = function (type, listener, options) {
        type = formatEventType(type, microWindow);
        const listenerList = eventListenerMap.get(type);
        if ((listenerList === null || listenerList === void 0 ? void 0 : listenerList.size) && listenerList.has(listener)) {
            listenerList.delete(listener);
        }
        rawWindowRemoveEventListener.call(rawWindow, type, listener, options);
    };
    microWindow.setInterval = function (handler, timeout, ...args) {
        const intervalId = rawSetInterval.call(rawWindow, handler, timeout, ...args);
        intervalIdMap.set(intervalId, { handler, timeout, args });
        return intervalId;
    };
    microWindow.setTimeout = function (handler, timeout, ...args) {
        const timeoutId = rawSetTimeout.call(rawWindow, handler, timeout, ...args);
        timeoutIdMap.set(timeoutId, { handler, timeout, args });
        return timeoutId;
    };
    microWindow.clearInterval = function (intervalId) {
        intervalIdMap.delete(intervalId);
        rawClearInterval.call(rawWindow, intervalId);
    };
    microWindow.clearTimeout = function (timeoutId) {
        timeoutIdMap.delete(timeoutId);
        rawClearTimeout.call(rawWindow, timeoutId);
    };
    const umdWindowListenerMap = new Map();
    const umdDocumentListenerMap = new Map();
    let umdIntervalIdMap = new Map();
    let umdTimeoutIdMap = new Map();
    let umdOnClickHandler;
    // record event and timer before exec umdMountHook
    const recordUmdEffect = () => {
        // record window event
        eventListenerMap.forEach((listenerList, type) => {
            if (listenerList.size) {
                umdWindowListenerMap.set(type, new Set(listenerList));
            }
        });
        // record timers
        if (intervalIdMap.size) {
            umdIntervalIdMap = new Map(intervalIdMap);
        }
        if (timeoutIdMap.size) {
            umdTimeoutIdMap = new Map(timeoutIdMap);
        }
        // record onclick handler
        umdOnClickHandler = documentClickListMap.get(appName);
        // record document event
        const documentAppListenersMap = documentEventListenerMap.get(appName);
        if (documentAppListenersMap) {
            documentAppListenersMap.forEach((listenerList, type) => {
                if (listenerList.size) {
                    umdDocumentListenerMap.set(type, new Set(listenerList));
                }
            });
        }
    };
    // rebuild event and timer before remount umd app
    const rebuildUmdEffect = () => {
        // rebuild window event
        umdWindowListenerMap.forEach((listenerList, type) => {
            for (const listener of listenerList) {
                microWindow.addEventListener(type, listener, listener === null || listener === void 0 ? void 0 : listener.__MICRO_MARK_OPTIONS__);
            }
        });
        // rebuild timer
        umdIntervalIdMap.forEach((info) => {
            microWindow.setInterval(info.handler, info.timeout, ...info.args);
        });
        umdTimeoutIdMap.forEach((info) => {
            microWindow.setTimeout(info.handler, info.timeout, ...info.args);
        });
        // rebuild onclick event
        umdOnClickHandler && documentClickListMap.set(appName, umdOnClickHandler);
        // rebuild document event
        setCurrentAppName(appName);
        umdDocumentListenerMap.forEach((listenerList, type) => {
            for (const listener of listenerList) {
                document.addEventListener(type, listener, listener === null || listener === void 0 ? void 0 : listener.__MICRO_MARK_OPTIONS__);
            }
        });
        setCurrentAppName(null);
    };
    // release all event listener & interval & timeout when unmount app
    const releaseEffect = () => {
        // Clear window binding events
        if (eventListenerMap.size) {
            eventListenerMap.forEach((listenerList, type) => {
                for (const listener of listenerList) {
                    rawWindowRemoveEventListener.call(rawWindow, type, listener);
                }
            });
            eventListenerMap.clear();
        }
        // Clear timers
        if (intervalIdMap.size) {
            intervalIdMap.forEach((_, intervalId) => {
                rawClearInterval.call(rawWindow, intervalId);
            });
            intervalIdMap.clear();
        }
        if (timeoutIdMap.size) {
            timeoutIdMap.forEach((_, timeoutId) => {
                rawClearTimeout.call(rawWindow, timeoutId);
            });
            timeoutIdMap.clear();
        }
        // Clear the function bound by micro application through document.onclick
        documentClickListMap.delete(appName);
        // Clear document binding event
        const documentAppListenersMap = documentEventListenerMap.get(appName);
        if (documentAppListenersMap) {
            documentAppListenersMap.forEach((listenerList, type) => {
                for (const listener of listenerList) {
                    rawDocumentRemoveEventListener.call(rawDocument, type, listener);
                }
            });
            documentAppListenersMap.clear();
        }
    };
    return {
        recordUmdEffect,
        rebuildUmdEffect,
        releaseEffect,
    };
}
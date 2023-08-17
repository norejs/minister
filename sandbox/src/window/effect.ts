import globalEnv from "../global";
/**
 * Rewrite side-effect events
 * @param microWindow micro window
 */
export function effectWindow(microWindow) {
    const appName = microWindow.__MINI_APP_NAME__;
    const { rawWindow } = globalEnv;

    const {
        addEventListener,
        removeEventListener,
        destory: eventListenerDestory,
    } = createEventPatition(rawWindow, appName);

    const {
        setTimeout,
        clearTimeout,
        destory: timeoutDestory,
    } = createTimerPation(rawWindow, "setTimeout", "clearTimeout");

    const {
        setInterval,
        clearInterval,
        destory: intervalDestory,
    } = createTimerPation(rawWindow, "setInterval", "clearInterval");

    microWindow.addEventListener = addEventListener;
    microWindow.removeEventListener = removeEventListener;
    microWindow.setTimeout = setTimeout;
    microWindow.clearTimeout = clearTimeout;
    microWindow.setInterval = setInterval;
    microWindow.clearInterval = clearInterval;

    return () => {
        eventListenerDestory();
        timeoutDestory();
        intervalDestory();
    };
}

export function effectDocument(microDocument, appName) {
    const { rawDocument } = globalEnv;
    const {
        addEventListener,
        removeEventListener,
        destory: eventListenerDestory,
    } = createEventPatition(rawDocument, appName);

    microDocument.addEventListener = addEventListener;
    microDocument.removeEventListener = removeEventListener;

    return () => {
        eventListenerDestory();
    };
}

// this events should be sent to the specified app
const formatEventList = ["unmount", "appstate-change"];
/**
 * Format event name
 * @param type event name
 * @param microWindow micro window
 */
function formatEventType(type, appName) {
    if (formatEventList.includes(type)) {
        return `${type}-${appName}`;
    }
    return type;
}
/** 创建时间分区管理 */
export function createEventPatition(rawObject, appName) {
    const eventListenerMap = new Map();
    const addEventListener = function (type, listener, options) {
        type = formatEventType(type, appName);
        const listenerList = eventListenerMap.get(type);
        if (listenerList) {
            listenerList.add(listener);
        } else {
            eventListenerMap.set(type, new Set([listener]));
        }
        listener && (listener.__MICRO_MARK_OPTIONS__ = options);
        rawObject["addEventListener"].call(rawObject, type, listener, options);
    };
    const removeEventListener = function (type, listener, options) {
        type = formatEventType(type, appName);
        const listenerList = eventListenerMap.get(type);
        if (
            (listenerList === null || listenerList === void 0 ? void 0 : listenerList.size) &&
            listenerList.has(listener)
        ) {
            listenerList.delete(listener);
        }
        rawObject["removeEventListener"].call(rawObject, type, listener, options);
    };
    return {
        addEventListener,
        removeEventListener,
        destory: () => {
            console.log("destory eventListenerMap", eventListenerMap);
            eventListenerMap.forEach((listenerList, type) => {
                listenerList.forEach(listener => {
                    rawObject["removeEventListener"].call(rawObject, type, listener);
                });
            });
            eventListenerMap.clear();
        },
    };
}

/** 创建 计时器 分区管理 */
export function createTimerPation(rawObject, functionName, reverFunctionName) {
    const intervalIdMap = new Map();
    const res: any = {};
    res[functionName] = function (handler, timeout, ...args) {
        const intervalId = rawObject[functionName].call(rawObject, handler, timeout, ...args);
        intervalIdMap.set(functionName + intervalId, { handler, timeout, args });
        return intervalId;
    };
    res[reverFunctionName] = function (timeoutId) {
        intervalIdMap.delete(functionName + timeoutId);
        rawObject[reverFunctionName].call(rawObject, timeoutId);

        return timeoutId;
    };
    res.destory = function () {
        intervalIdMap.forEach((_, intervalId) => {
            rawObject[reverFunctionName].call(rawObject, intervalId);
        });
        intervalIdMap.clear();
    };
    return res;
}

import ministerApp from "../minister";
import { logError, isFunction, removeDomScope, isShadowRoot, logWarn } from "../libs/utils";
function eventHandler(event, element) {
    Object.defineProperties(event, {
        currentTarget: {
            get() {
                return element;
            },
        },
        target: {
            get() {
                return element;
            },
        },
    });
}
/**
 * 触发生命周期事件 to base app
 * created, beforemount, mounted, unmount, error
 * @param element container
 * @param appName app.name
 * @param lifecycleName lifeCycle name
 * @param error param from error hook
 */
export default function dispatchLifecyclesEvent(element, appName, lifecycleName, error, data) {
    if (!element) {
        return logError(`element does not exist in lifecycle ${lifecycleName}`, appName);
    } else if (isShadowRoot(element)) {
        element = element.host;
    }
    // 清除Document上的属性和副作用补丁 对应方法为 patchDocument，本质是改变了判断条件
    // 暂时不添加 目前在mounted环节 处理了
    removeDomScope();
    const detail = Object.assign(
        {
            name: appName,
            container: element,
        },
        error && {
            error,
        },
        data || {}
    );
    const event = new CustomEvent(lifecycleName, {
        detail,
    });
    // 添加target属性
    eventHandler(event, element);
    try {
        if (isFunction(ministerApp.lifeCycles[lifecycleName])) {
            // 这里触发的是全局事件 global hooks 在start()的时候传递的lifeCycles options
            ministerApp.lifeCycles[lifecycleName](event);
        }
    } catch (error) {
        // logWarn(`element does not exist in lifecycle ${lifecycleName}`, appName, error)
    }
    const rawWindowEvent = new CustomEvent(lifecycleName + "-" + appName, { detail });
    window.dispatchEvent(rawWindowEvent);
    // 在对应的app实例中 触发对应的自定义事件
    element.dispatchEvent(event);
    return event;
}

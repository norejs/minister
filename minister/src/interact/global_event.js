import ministerApp from '../minister'
import { logError, isFunction, logWarn } from "../libs/utils";

export default function dispatchGlobalEvent(element, appName, lifecycleName, url) {
    try {
        if (isFunction(ministerApp.events[lifecycleName])) {
            // 这里触发的是全局事件 global hooks 在start()的时候传递的lifeCycles options
            return ministerApp.events[lifecycleName]({ element, appName, url });
        }
    } catch (error) {
        logWarn(`element does not exist in lifecycle ${lifecycleName}`, appName, error)
    }
}
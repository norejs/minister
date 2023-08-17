import { IS_RUNTIME_DEBUG, IS_TEST_HOST } from "./env";
const isDebug = IS_RUNTIME_DEBUG || IS_TEST_HOST;

export function log(...args) {
    if (isDebug) {
        console.log("minister:", ...args,);
    }
}
export function warn(...args) {
    if (isDebug) {
        console.warn("minister:", ...args);
    }
}
export function error(...args) {
    if (isDebug) {
        console.error("minister:", ...args);
    }
}

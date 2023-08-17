import { isString, isFunction } from "../helpers/is";
import get from "./get";

const run = (obj, keys = [], ...args) => {
    keys = isString(keys) ? keys.split(".") : keys;

    const func = get(obj, keys);
    const context = get(obj, keys.slice(0, -1));

    return isFunction(func) ? func.call(context, ...args) : func;
};

export default run;

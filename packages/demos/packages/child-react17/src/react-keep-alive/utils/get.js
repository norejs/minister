import { isNumber, isString, isUndefined } from "../helpers/is";

const get = (obj, keys = [], defaultValue) => {
    try {
        if (isNumber(keys)) {
            keys = String(keys);
        }
        let result = (isString(keys) ? keys.split(".") : keys).reduce(
            (res, key) => res[key],
            obj,
        );
        return isUndefined(result) ? defaultValue : result;
    } catch (e) {
        return defaultValue;
    }
};

export default get;

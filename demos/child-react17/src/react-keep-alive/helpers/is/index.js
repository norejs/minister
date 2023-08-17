export const isRegExp = (val) => val instanceof RegExp;

export const isFunction = func => typeof func === "function";

export const isUndefined = val => typeof val === "undefined";

export const isString = val => typeof val === "string";

// eslint-disable-next-line no-self-compare
export const isNaN = val => val !== val;

export const isNull = val => val === null;

export const isNumber = val => typeof val === "number" && !isNaN(val);

export const isArray = Array.isArray || (val => val instanceof Array);

export const isObject = val => typeof val === "object" && !(isArray(val) || isNull(val));

export const isExist = val => !(isUndefined(val) || isNull(val));

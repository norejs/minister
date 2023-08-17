import { isArray } from "../helpers/is";

const flatten = Array.prototype.flat
    ? (arr) => Array.prototype.flat.call(arr, Infinity)
    : (arr) => arr.reduce((acc, cur) => acc.concat(isArray(cur) ? flatten(cur) : cur), []);

export default flatten;

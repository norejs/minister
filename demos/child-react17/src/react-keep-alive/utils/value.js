import { isUndefined } from "../helpers/is";
import run from "./run";

/**
 * 从一系列参数中取出第一个不为 undefined 的值
 * @param {Function|undefined|any} values
 * @return {*}
 * @example
 * value(undefined, undefined, "default"); // => "default"
 *
 * value(undefined, []); // => []
 *
 * value(undefined, () => {
 *     console.log("first");
 *     return undefined;
 * }, () => {
 *     console.log("second");
 *     return 0;
 * }); // => 0
 */
const value = (...values) =>
    values.reduce(
        (value, nextValue) => (isUndefined(value) ? run(nextValue) : run(value)),
        undefined,
    );

export default value;

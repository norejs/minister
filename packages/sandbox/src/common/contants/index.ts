export const staticEscapeProperties = ["System", "__cjsWrapper", "__REACT_ERROR_OVERLAY_GLOBAL_HOOK__"];

// 只能赋值给rawWindow的变量,
// TODO: location 也需要代理
export const escapeSetterKeyList = ["location"];

// with(window){}下不代理的属性
export const withUnscopables = {
    undefined: true,
    Array: true,
    Object: true,
    String: true,
    Boolean: true,
    Math: true,
    Number: true,
    Symbol: true,
    parseFloat: true,
    Float32Array: true,
};

export const scopeProperties = ["webpackJsonp"];

import { isBoundFunction } from "@minister/utils";
import MiniProxy from "../proxy";
import globalEnv from "../global";
import { effectDocument } from "./effect";
function tryBindFunctionToRaw(raw, fn) {
    return typeof fn === "function" && !isBoundFunction(fn) ? fn.bind(raw) : fn;
}
function markElement(element, appName, key: any = "", args: any = "") {
    if (!element || !appName) {
        return;
    }
    if (element?.length > 0) {
        for (var i = 0; i < element.length; i++) {
            markElement(element[i], appName);
        }
        return element;
    }
    try {
        if (element.id && !isNaN(element.id[0])) {
            element.id = "mini-app-" + element.id;
        }
        element.__MINI_APP_NAME__ = appName;
    } catch (error) {
        console.log(element, appName, "error");
    }

    return element;
}

export function createDocumentProxy(appName, rootElement, subElementPrefix = "mini-app-") {
    const { rawDocument } = globalEnv;

    const miniDocument = {
        __MINI_APP_ENVIRONMENT__: true,
        __MINI_APP_NAME__: appName,
    };

    effectDocument(miniDocument, appName);
    return new MiniProxy(rawDocument, miniDocument, {
        get(target, key) {
            switch (key) {
                case "createElement":
                case "createElementNS":
                case "createDocumentFragment":
                    return ((...args) => {
                        const element = rawDocument[key].apply(rawDocument, args);
                        return markElement(element, appName, key, args);
                    }).bind(rawDocument);

                case "querySelector":
                case "querySelectorAll":
                    // 替换html,head和body
                    return (...args) => {
                        args[0] = args[0].replace(/(^|[^.#])\b(body|html|head)\b/gi, `$1${subElementPrefix}$2`);
                        const elements = rootElement[key].call(rootElement, ...args);
                        markElement(elements, appName, key, args);
                        return elements;
                    };
                case "getElementsByTagName":
                    return (...args) => {
                        args[0] = args[0].replace(/(^|[^.#])\b(body|html|head)\b/gi, `$1${subElementPrefix}$2`);
                        const elements = rootElement["querySelectorAll"].call(rootElement, ...args);
                        markElement(elements, appName, key, args);
                        return elements;
                    };
                case "getElementsByClassName":
                    return className => {
                        const elements = rootElement["querySelectorAll"].call(rootElement, " ." + key);
                        markElement(elements, appName, className, className);
                        return elements;
                    };
                case "getElementById":
                    return id => {
                        try {
                            const myid = isNaN(id[0]) ? id.toString() : "mini-app-" + id;
                            const elements = rootElement["querySelector"].call(rootElement, "#" + myid);
                            markElement(elements, appName, key, id);
                            return elements;
                        } catch (error) {
                            console.error(error);
                        }
                    };

                case "body":
                case "head":
                    console.log("body",rootElement);
                    return rootElement.querySelector(subElementPrefix + key);
                case "documentElement":
                    return rootElement;
                default:
                    return tryBindFunctionToRaw(rawDocument, rawDocument[key]);
            }
        },
    });
}

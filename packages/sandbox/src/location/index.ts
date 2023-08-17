import MiniProxy from "../proxy";
import globalEnv from "../global";
import { isBoundFunction } from "@minister/utils";
type ILocationOption = {
    appName: string;
    replaceBaseHash?: boolean;
    baseUrl?: string;
    onRedirect?: (url: String) => Boolean | void;
};

function tryBindFunctionToRaw(raw, fn) {
    return typeof fn === "function" && !isBoundFunction(fn) ? fn.bind(raw) : fn;
}

export function createLocationProxy({ appName = "", baseUrl = "", onRedirect } = {} as ILocationOption) {
    const { rawLocation } = globalEnv;
    if (!appName) {
        return rawLocation;
    }
    if (!baseUrl) {
        baseUrl = appName;
    }

    const miniLocation = {
        __MINI_APP_ENVIRONMENT__: true,
        __MINI_APP_NAME__: appName,
    };

    function trigerEvent(name, url) {
        switch (name) {
            case "redirect":
                if (typeof onRedirect === "function") {
                    const isContinue = onRedirect(url);
                    return isContinue !== false;
                }
        }
        return true;
    }

    return new MiniProxy(rawLocation, miniLocation, {
        get(target, key) {
            switch (key) {
                case "href":
                case "hash":
                    return rawLocation[key].replace(`#/${baseUrl}`, "#");
                case "replace":
                    return function (value) {
                        value = value.replace(`#/`, `#/${baseUrl}/`);
                        const isContinue = trigerEvent("redirect", value);
                        return isContinue && rawLocation.replace(value);
                    }.bind(rawLocation);
                default:
                    const res = rawLocation[key];
                    return tryBindFunctionToRaw(rawLocation, res);
            }
        },
        set(target, key, value) {
            switch (key) {
                case "hash":
                    if (!value.startsWith(`#`)) {
                        value = `#${value}`;
                    }
                    value = value.replace(`#`, `#/${baseUrl}`);
                    break;
                case "href":
                    value = completeUrl(value);
                    const isContinue = trigerEvent("redirect", value);
                    if (!isContinue) {
                        return true;
                    }
                    break;
            }
            return Reflect.set(rawLocation, key, value);
        },
    });
}

// 补全URL
function completeUrl(url, baseUrl = location.origin + location.pathname) {
    if (url.startsWith("http") || url.startsWith("//")) {
        return url;
    }
    if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
    }
    return url;
}

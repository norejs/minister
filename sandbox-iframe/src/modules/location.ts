import MiniProxy from "../libs/mini-proxy";
import { isAbsoluteUrl, isRelativeUrl } from "../libs/url";
export default class MLocation {
    proxy: ProxyConstructor;
    private rawLocation: Location;
    private parentHost: string;
    private childBaseUrl: string;
    private options: any;
    constructor(rawLocation: Location, options: any) {
        const { target: _target = {}, parentLocation, url } = options;
        this.rawLocation = rawLocation;
        this.options = options;
        this.parentHost = parentLocation.protocol + "//" + parentLocation.host + parentLocation.pathname;
        const childUrl = new URL(url);

        this.childBaseUrl = rawLocation.protocol + rawLocation.host + rawLocation.pathname;
        console.log(parentLocation, this.rawLocation, childUrl, this.childBaseUrl);
        this.rawLocation = rawLocation;
        const convertToChildUrl = this.convertToChildUrl.bind(this);
        var self = this;

        this.proxy = new MiniProxy(parentLocation, _target, {
            get: (target, key) => {
                console.log("get", key);
                switch (key) {
                    case "href":
                        return this.covertToRawUrl(Reflect.get(rawLocation, key));
                    case "replace":
                        return function (value) {
                            self.redirect(value, "replace");
                        }.bind(rawLocation);
                    case "pathname":
                    case "host":
                    case "hostname":
                        console.log(childUrl[key]);
                        return childUrl[key];
                    case "assign":
                        return function (value) {
                            value = convertToChildUrl(value);
                            rawLocation.assign(value);
                        }.bind(rawLocation);
                }
            },
            set: (target, key, value) => {
                switch (key) {
                    case "href":
                        // value = this.convertToChildUrl(value);
                        if (value.startsWith("#")) {
                            key = "hash";
                        }
                        this.redirect(value);
                }
                return Reflect.set(rawLocation, key, value);
            },
        }).proxyInstance;
    }
    redirect(url, type = "push") {
        const { parentLocation, onRedirect } = this.options;
        if (onRedirect && onRedirect(url, type)) {
            return true;
        }
        if (isRelativeUrl(url, this.childBaseUrl)) {
        }
        if (type === "replace") {
            return parentLocation.replace(url);
        }
        return (parentLocation.href = url);
    }
    convertToChildUrl(url: string) {
        console.log("pz convertToChildUrl", url, this.childBaseUrl);
        if (url.startsWith(this.options.url)) {
            return url.replace(this.options.url, this.childBaseUrl);
        }
        return url;
    }
    convertToParentUrl(url: string) {
        if (url.startsWith(this.childBaseUrl)) {
            return url.replace(this.childBaseUrl, this.parentHost);
        }
        return url;
    }
    covertToRawUrl(url: string) {
        console.log("pz covertToRawUrl", url, this.childBaseUrl);
        if (url.startsWith(this.childBaseUrl)) {
            return url.replace(this.childBaseUrl, this.options.url);
        }
        return url;
    }

    // 三种URL相互转换
    // 父应用Location
    // 子应用原本的Location
    // 子应用现有的Location
}

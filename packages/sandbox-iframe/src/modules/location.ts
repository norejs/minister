import MiniProxy from '../libs/mini-proxy';
import { isOnlyHashDiffrent, isRelativeUrl } from '../libs/url';

type MLocationOptions = {
    parentLocation: Location;
    url: string;
    onRedirect: (url: string) => boolean;
    target?: any;
}
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
        this.parentHost =
            parentLocation.protocol +
            '//' +
            parentLocation.host +
            parentLocation.pathname;
        const childUrl = new URL(url);

        this.childBaseUrl =
            rawLocation.protocol + rawLocation.host + rawLocation.pathname;
        this.rawLocation = rawLocation;
        const convertToChildUrl = this.convertToChildUrl.bind(this);
        var self = this;

        this.proxy = new MiniProxy(parentLocation, _target, {
            get: (target, key) => {
                switch (key) {
                    case 'search':
                        return rawLocation.search;
                    case 'hash':
                        return rawLocation.hash;
                    case 'href':
                        return this.covertToRawUrl(
                            Reflect.get(rawLocation, key)
                        );
                    case 'replace':
                        return function (value) {
                            self.redirect(value, 'replace');
                        }.bind(rawLocation);
                    case 'origin':
                    case 'protocol':
                    case 'port':
                    case 'pathname':
                    case 'host':
                    case 'hostname':
                        return childUrl[key];
                    case 'assign':
                        return function (value) {
                            value = convertToChildUrl(value);
                            rawLocation.assign(value);
                        }.bind(rawLocation);
                }
            },
            set: (target, key, value) => {
                switch (key) {
                    case 'href':
                        return this.redirect(value, 'push');
                    case 'hash':
                        if (!value.startsWith('#')) {
                            value = '#' + value;
                        }
                        return this.redirect(value, 'push');
                }
                return Reflect.set(rawLocation, key, value);
            },
        }).proxyInstance;
    }
    redirect(url, type = 'push') {
        const { parentLocation, onRedirect } = this.options;
        if (isOnlyHashDiffrent(url, this.options.url)) {
            return Reflect.set(this.rawLocation, 'hash', url);
        }
        if (type === 'replace') {
            return parentLocation.replace(url);
        }
        return (parentLocation.href = url);
    }
    convertToChildUrl(url: string) {
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
        if (url.startsWith(this.childBaseUrl)) {
            return url.replace(this.childBaseUrl, this.options.url);
        }
        return url;
    }
}

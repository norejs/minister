import { isBoundFunction } from '@minister/utils';
import MiniProxy from '../libs/mini-proxy';
declare global {
    interface Window {
        Element: any;
        HTMLElement: any;
        Node: any;
    }
}

function tryBindFunctionToRaw(raw, fn) {
    return typeof fn === 'function' && !isBoundFunction(fn) ? fn.bind(raw) : fn;
}

type DocumentOptions = {
    rootElement: HTMLElement;
    rawWindow: Window;
    target?: any;
    onAddElement?: Function;
    subElementPrefix?: string;
    onInjectScript?: Function;
};

export default class MDocument {
    proxy: MiniProxy;
    private rawWindow: Window;
    constructor(
        private rawDocument: Document,
        private options: DocumentOptions
    ) {
        this.initProxy();
    }
    handleAddEventListener(type, listener, options) {
        if (
            [
                'click',
                'touchstart',
                'touchmove',
                'touchend',
                'touchcancel',
            ].includes(type)
        ) {
            return this.options.rootElement.addEventListener(
                type,
                listener,
                options
            );
        }
        return this.rawDocument.addEventListener(type, listener, options);
    }
    handleRemoveEventListener(type, listener, options) {
        if (
            [
                'click',
                'touchstart',
                'touchmove',
                'touchend',
                'touchcancel',
            ].includes(type)
        ) {
            return this.options.rootElement.removeEventListener(
                type,
                listener,
                options
            );
        }
        return this.rawDocument.addEventListener(type, listener, options);
    }
    initProxy() {
        const {
            target: initTarget = {},
            rootElement,
            subElementPrefix = 'mini-app-',
            onInjectScript: Function,
            rawWindow,
        } = this.options;
        const rawDocument = this.rawDocument;
        this.rawWindow = rawWindow;
        const self = this;
        this.proxy = new MiniProxy(this.rawDocument, initTarget, {
            get: (target, key) => {
                switch (key) {
                    // case "createElement":
                    // case "createElementNS":
                    // case "createDocumentFragment":
                    //     return ((...args) => {
                    //         const element = rawDocument[key].apply(rawDocument, args);
                    //         return markElement(element, appName, key, args);
                    //     }).bind(rawDocument);
                    case 'querySelector':
                    case 'querySelectorAll':
                        // 替换html,head和body
                        return (...args) => {
                            args[0] = args[0].replace(
                                /(^|[^.#])\b(body|html|head)\b/gi,
                                `$1${subElementPrefix}$2`
                            );
                            const elements = rootElement[key].call(
                                rootElement,
                                ...args
                            );
                            // markElement(elements, appName, key, args);
                            return elements;
                        };
                    case 'getElementsByTagName':
                        return (...args) => {
                            args[0] = args[0].replace(
                                /(^|[^.#])\b(body|html|head)\b/gi,
                                `$1${subElementPrefix}$2`
                            );
                            const elements = rootElement[
                                'querySelectorAll'
                            ].call(rootElement, ...args);
                            // markElement(elements, appName, key, args);
                            return elements;
                        };
                    case 'getElementsByClassName':
                        return (className) => {
                            const elements = rootElement[
                                'querySelectorAll'
                            ].call(rootElement, ' .' + key);
                            // markElement(elements, appName, className, className);
                            return elements;
                        };
                    case 'getElementById':
                        return (id) => {
                            try {
                                const myid = isNaN(id[0])
                                    ? id.toString()
                                    : 'mini-app-' + id;
                                const elements = rootElement[
                                    'querySelector'
                                ].call(rootElement, '#' + myid);
                                // markElement(elements, appName, key, id);
                                return elements;
                            } catch (error) {
                                console.error(error);
                            }
                        };

                    case 'body':
                    case 'head':
                        return rootElement.querySelector(
                            subElementPrefix + key
                        );
                    case 'documentElement':
                        return rootElement;
                    case 'addEventListener':
                        return this.handleAddEventListener.bind(this);
                    case 'removeEventListener':
                        return this.handleRemoveEventListener.bind(this);
                    case 'defaultView':
                        return rawWindow.__MINI_APP_WINDOW__;
                    case 'location':
                        return rawWindow?.__MINI_APP_WINDOW__?.["location"];
                    default:
                        return tryBindFunctionToRaw(
                            rawDocument,
                            rawDocument[key]
                        );
                }
            },
        }).proxyInstance;
        this.patchElement();
        this.patchNode();
    }

    handleAddElement = (
        parent,
        newChild,
        passiveChild = undefined,
        rawMethod,
        source = ''
    ) => {
        if (this.options.rootElement.contains(parent)) {
            const { onAddElement } = this.options;
            if (onAddElement) {
                const replaceElement = onAddElement(
                    parent,
                    newChild,
                    passiveChild,
                    rawMethod,
                    source
                );
                if (replaceElement) {
                    return rawMethod.call(parent, replaceElement, passiveChild);
                } else {
                    return rawMethod.call(parent, newChild, passiveChild);
                }
            }

            if (newChild && newChild.id && !isNaN(newChild.id[0])) {
                newChild.id = 'mini-app-' + newChild.id;
            }
            return rawMethod.call(parent, newChild, passiveChild);
        } else {
            return rawMethod.call(parent, newChild, passiveChild);
        }
    };
    patchNode() {
        const rawAppendChild = this.rawWindow.Node.prototype.appendChild;
        const rawInsertBefore = this.rawWindow.Node.prototype.insertBefore;
        const rawReplaceChild = this.rawWindow.Node.prototype.replaceChild;
        const rawRemoveChild = this.rawWindow.Node.prototype.removeChild;
        // prototype methods of add element
        const self = this;
        this.rawWindow.Node.prototype.appendChild = function appendChild(
            newChild
        ) {
            return self.handleAddElement(this, newChild, null, rawAppendChild);
        };
        this.rawWindow.Node.prototype.insertBefore = function insertBefore(
            newChild,
            refChild
        ) {
            return self.handleAddElement(
                this,
                newChild,
                refChild,
                rawInsertBefore
            );
        };
        this.rawWindow.Node.prototype.replaceChild = function replaceChild(
            newChild,
            oldChild
        ) {
            return self.handleAddElement(
                this,
                newChild,
                oldChild,
                rawReplaceChild
            );
        };
        // Node.prototype.removeChild = function removeChild(oldChild) {
        //     return this.handleAddElement(this, oldChild, null, rawRemoveChild);
        // };
    }
    patchElement() {
        const self = this;
        const rawSetAttribute = this.rawWindow.Element.prototype.setAttribute;

        const rawAppend = this.rawWindow.Element.prototype.append;
        const rawPrepend = this.rawWindow.Element.prototype.prepend;
        this.rawWindow.Element.prototype.setAttribute = function setAttribute(
            key,
            value
        ) {
            if (
                (key === 'src' && /^(img|script)$/i.test(this.tagName)) ||
                (key === 'href' && /^link$/i.test(this.tagName))
            ) {
                // TODO: 补全URL
                rawSetAttribute.call(this, key, value);
            } else {
                rawSetAttribute.call(this, key, value);
            }
        };

        this.rawWindow.Element.prototype.append = function append(...nodes) {
            let i = 0;
            const length = nodes.length;
            while (i < length) {
                self.handleAddElement(this, nodes[i], null, rawAppend);
                i++;
            }
        };
        this.rawWindow.Element.prototype.prepend = function prepend(...nodes) {
            let i = nodes.length;
            while (i > 0) {
                self.handleAddElement(this, nodes[i - 1], null, rawPrepend);
                i--;
            }
        };
    }
}

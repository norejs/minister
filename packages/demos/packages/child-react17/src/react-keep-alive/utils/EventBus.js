import { isFunction, isUndefined } from "../helpers/is";

export default class EventBus {
    listeners = {};

    getEventMap = (event) => {
        if (!this.listeners[event]) {
            this.listeners[event] = new Map();
        }

        return this.listeners[event];
    };

    on = (
        event,
        listener,
        { once = false } = {},
    ) => {
        if (!isFunction(listener)) {
            console.error("[EventBus Error] listener is not a function");
            return this;
        }

        this.getEventMap(event).set(
            listener,
            once
                ? (...args) => {
                    listener(...args);
                    this.off(event, listener);
                }
                : listener,
        );

        return this;
    };

    once = (event, listener, config = {}) =>
        this.on(event, listener, { ...config, once: true });

    off = (event, listener) => {
        const eventMap = this.getEventMap(event);

        if (isUndefined(listener)) {
            eventMap.clear();
        } else {
            eventMap.delete(listener);
        }

        return this;
    };

    emit = (event, ...args) =>
        this.getEventMap(event).forEach((listener) => listener(...args));
}

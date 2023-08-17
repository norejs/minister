const getImplementation = () => {
    // eslint-disable-next-line no-restricted-globals
    if (typeof self !== "undefined") {
        // eslint-disable-next-line no-restricted-globals
        return self;
    }
    if (typeof window !== "undefined") {
        return window;
    }
    if (typeof global !== "undefined") {
        return global;
    }

    throw new Error("unable to locate global object");
};

const implementation = getImplementation();

const getGlobal = () => {
    if (
        typeof global !== "object" ||
        !global ||
        global.Math !== Math ||
        global.Array !== Array
    ) {
        return implementation;
    }
    return global;
};

const globalThis = getGlobal();

export default globalThis;

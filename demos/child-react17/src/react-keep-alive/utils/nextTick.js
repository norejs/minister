const nextTick = func => Promise.resolve().then(func);

export default nextTick;

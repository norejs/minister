import { LRUCache, LFUCache } from "./cache-strategy";
import { logWarn, isNumber, isBoolean, isString } from "./libs/utils";
import { CACHE_STRATEGY, DEFAULT_CACHE_CAPACITY } from "./constants";

/**
 * 缓存池(每个tagName对应一个Cache)
 * @type {Map<string, (LRUCache|LFUCache)>}
 */
const cacheMaps = new Map();

/**
 * 设置缓存策略
 * @param {(string|boolean)} cacheStrategy - 缓存策略
 * @param {number} cacheCapacity - 缓存池的大小(维护多少份缓存)
 * @param {string} tagName - customElements name(自定义元素的名字)
 */
function setCache(
    cacheStrategy,
    cacheCapacity = DEFAULT_CACHE_CAPACITY,
    tagName
) {
    // tagName不允许重复
    if (cacheMaps.has(tagName)) {
        return logWarn(`element ${tagName} is already defined`);
    }

    if (isString(cacheStrategy)) {
        cacheStrategy = cacheStrategy.toLowerCase();
        if (Object.values(CACHE_STRATEGY).includes(cacheStrategy)) {
            cacheStrategy = CACHE_STRATEGY.LRU;
            logWarn(`cacheStrategy should be one of lru or lfu`);
        }
    }

    if (isBoolean(cacheStrategy) && cacheCapacity) {
        cacheStrategy = CACHE_STRATEGY.LRU;
    }

    if (isNumber(cacheCapacity)) {
        if (cacheCapacity <= 0) {
            // 缓存的容量必须为正整数
            cacheCapacity = DEFAULT_CACHE_CAPACITY;
            logWarn(`cacheCapacity should be a positive number`);
        }
        if (!Number.isInteger(cacheCapacity)) {
            cacheCapacity |= 0;
            logWarn(`cacheCapacity should be a positive integer`);
        }
    }

    let cacheMap;
    if (cacheStrategy === CACHE_STRATEGY.LFU) {
        cacheMap = new LFUCache(cacheCapacity);
    } else {
        cacheMap = new LRUCache(cacheCapacity);
    }

    cacheMaps.set(tagName, cacheMap);
    console.log("fuck cacheMap", cacheMap);
}

export default cacheMaps;
export {
    cacheMaps,
    setCache,
};

export const OBSERVED_ATTR_NAME = {
  NAME: 'name',
  URL: 'url',
}

// app status
export const APP_STATUS= {
  NOT_LOADED: 'NOT_LOADED',
  LOADING_SOURCE_CODE: 'LOADING_SOURCE_CODE',
  LOAD_SOURCE_FINISHED: 'LOAD_SOURCE_FINISHED',
  LOAD_SOURCE_ERROR: 'LOAD_SOURCE_ERROR',
  MOUNTING: 'MOUNTING',
  MOUNTED: 'MOUNTED',
  UNMOUNT: 'UNMOUNT',
  KEEP_ALIVE_HIDDEN: 'KEEP_ALIVE_HIDDEN',
  KEEP_ALIVE_SHOW: 'KEEP_ALIVE_SHOW',
}

// 生命周期
export const LIFECYCLES = {
  CREATED: 'created',
  BEFOREMOUNT: 'beforemount',
  MOUNTED: 'mounted',
  UNMOUNT: 'unmount',
  ERROR: 'error',
  // 👇 keep-alive only
  BEFORESHOW : 'beforeshow',
  AFTERSHOW : 'aftershow',
  AFTERHIDDEN : 'afterhidden',
  // 路由跳转
  REDIRECT: 'redirect',
}

// 缓存策略
export const CACHE_STRATEGY = {
    LRU: "lru",
    LFU: "lfu",
};

// 缓存池默认大小
export const DEFAULT_CACHE_CAPACITY = 8;

# 微前端应用级别缓存策略

### 使用

开启应用缓存策略：在基座应用中，配置项传入`cacheStrategy`和`cacheCapacity`两个参数。

1. cacheStrategy 参数
    - 该参数代表缓存策略，如LRU缓存策略和LFU缓存策略
    - 目前接受参数类型为 string 和 boolean，如果需开启缓存策略，则该参数必传
    - string 类型须为 lru 或者 lfu 两者之一，忽略大小写，传入空字符串会生成警告。eg: `{ ...configs, cacheStrategy: "lru" | "lfu" }`
    - boolean 类型值为 true 则开启，策略默认为lru，值为 false 则不开启。eg: `{ ...configs, cacheStrategy: true | false }`
2. cacheCapacity 参数
    - 该参数代表缓存容量
    - 该参数非必传，只接受传入正整数，传入小于等于0的数会生成警告
    - 如果已经传入 cacheStrategy 参数，未设置 cacheCapacity，会使用默认容量

```javascript
microApp.start({
    ...configs,
    cacheStrategy: string|boolean,
    cacheCapacity: number,
});
```

### 开启后的现象

如果基座应用开启了缓存策略，以 `{ cacheStrategy: "LRU", cacheCapacity: 8 }`为例：

1. 如果子应用设置了`keep-alive`，则路由切换，该子应用不会被销毁，而是会被存入缓存池，缓存池大小为8，当有超出缓存池容量
的子应用需要缓存时，会优先从缓存池中删除最久未使用的那份缓存。
缓存从缓存池中删除后，会触发应用卸载的生命周期

如果基座应用未开启缓存策略，子应用设置了`keep-alive`，则进行正常的缓存逻辑

### 实现

1. 缓存池核心类`LRUCache.js`和`LFUCache.js`
2. 缓存策略相关逻辑位于`micro_app.js`、`create_app.js`和`micro_app_element.js`中

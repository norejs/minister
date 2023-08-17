export interface IProxyOptions {
    get?: Function;
    set?: Function;
    unscopables?: any;
    selfKeys?: Array<string | symbol>;
    scopeProperties?: Array<string | symbol>;
    scopePropertyKeyPrefix?: string;
    escapeSetterKeyList?: Array<string | symbol>;
    // 可以舍set到原数据的key
    escapeProperties?: Array<string | symbol>;
    // 只设置一次到原数据dekey？
    escapeOnceProperties?: Array<string | symbol>;
}

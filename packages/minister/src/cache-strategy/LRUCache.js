import Node from "./Node";
import { elementInstanceMap } from "../minister_element";

/**
 * `LRU(Least Recently Used/最近最少使用)` 缓存策略。<br/>
 * 最多维护 capacity 份缓存，如果容量超出，则会移除最久未使用过的缓存
 *
 * @example
 * const cache = new LRUCache(2);
 * cache.put(1, 32); // => void
 * cache.put(2, 1024); // => void
 * cache.get(1); // => 32
 * cache.put(3, 2048); // 超出容量，会删除 2 对应的缓存
 */
class LRUCache {
    /**
     * @type {Map<any, Node>}
     */
    nodeMap = new Map();
    head = new Node(-1, -1);
    tail = new Node(-1, -1);
    capacity;

    constructor(capacity = 16) {
        this.capacity = capacity;
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }

    /**
     * 根据 key 获取缓存中的数据，如果没有缓存，则返回 null
     * @param {any} key
     * @return {any}
     */
    get(key) {
        if (!this.nodeMap.has(key)) return null;
        let node = this.nodeMap.get(key);
        this.unlink(node);
        this.addToHead(node);
        return node.val;
    }

    /**
     * 更新缓存。<br/>
     * 如果是已有的缓存，进行更新；否则，新建一份缓存，如果容量超出，则移除最久未使用的缓存
     * @param {any} key
     * @param {any} value
     */
    put(key, value) {
        if (this.nodeMap.has(key)) {
            let node = this.nodeMap.get(key);
            node.val = value;
            this.unlink(node);
            this.addToHead(node);
        } else {
            if (this.nodeMap.size >= this.capacity) {
                const nodeToBeRemoved = this.tail.prev;
                console.log("fuck lru drop", nodeToBeRemoved);
                // 从缓存中移除后，触发组件卸载过程
                const appName = nodeToBeRemoved.key;
                const eleInstance = elementInstanceMap.get(appName);
                eleInstance?.unmountProcedure();
                console.log("fuck ele", eleInstance);
                this.nodeMap.delete(nodeToBeRemoved.key);
                this.unlink(nodeToBeRemoved);
            }
            let node = new Node(key, value);
            this.addToHead(node);
            this.nodeMap.set(key, node);
        }
    }

    /**
     * 将指定节点从链表中移除
     * @param {Node} node
     */
    unlink(node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }

    /**
     * 将指定节点添加到头部
     * @param {Node} node
     */
    addToHead(node) {
        node.next = this.head.next;
        node.next.prev = node;
        this.head.next = node;
        node.prev = this.head;
    }


    /** 劫持 Map 部分原生的方法 **/

    set(key, value) {
        this.put(key, value);
    }

    has(key) {
        return this.nodeMap.has(key);
    }

    delete(key) {
        this.unlink(this.nodeMap.get(key));
        this.nodeMap.delete(key);
    }

    get size() {
        return this.nodeMap.size;
    }

    keys() {
        return this.nodeMap.keys();
    }

    values() {
        return [...this.nodeMap.values()].map(node => node.val);
    }
}

export default LRUCache;

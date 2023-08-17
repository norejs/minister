import Node from "./Node";
import { elementInstanceMap } from "../minister_element";

// const INF = 0x7fffffff;

/**
 * 用于 LFU 缓存中的块。<br/>
 * 每个块中存储了一个双链表来获取最久未使用过的缓存。
 */
class Block {
    prev = null;
    next = null;
    head = new Node(-1, -1);
    tail = new Node(-1, -1);

    constructor(cnt) {
        this.cnt = cnt;
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }

    /**
     * 向 块 中的链表插入一个节点
     * @param {Node} node
     */
    insert(node) {
        node.next = this.head.next;
        node.next.prev = node;
        this.head.next = node;
        node.prev = this.head;
    }

    /**
     * 移除 块 中链表的一个节点
     * @param {Node} node
     */
    remove(node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }

    /**
     * 判断 块 中的链表是否为空
     * @return {boolean}
     */
    isEmpty() {
        return this.head.next === this.tail;
    }
}

/**
 * `LFU(Least Frequently Used/最不经常使用)` 缓存策略。<br/>
 * 最多维护 capacity 份缓存，如果容量超出，则会移除使用次数最少的且最久未使用过的缓存。<br/>
 * 注意与 LRU 缓存策略的区别。
 *
 * @example
 * const cache = new LFUCache(2);
 * cache.put(1, 32); // => void
 * cache.put(2, 1024); // => void
 * cache.get(1); // => 32
 * cache.get(2); // 1024
 * cache.put(3, 2048); // 超出容量，1 和 2 的使用次数均为 2 次(put也算一次使用)，但 1 先被使用，距离现在久，所以会删除 1
 */
class LFUCache {
    head = new Block(0);
    tail = new Block(0x7f7f7f7f);
    /**
     * @type {Map<any, Block>}
     */
    blockMap = new Map();
    /**
     * @type {Map<any, Node>}
     */
    nodeMap = new Map();
    capacity;

    constructor(capacity = 16) {
        this.capacity = capacity;
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }

    /**
     * 根据 key 获取缓存
     * @param {any} key
     */
    get(key) {
        if (!this.blockMap.has(key)) return null;
        let block = this.blockMap.get(key);
        let node = this.nodeMap.get(key);
        block.remove(node); // 将节点从原来的块(使用次数为 cnt 的块)中删除
        if (block.next.cnt !== block.cnt + 1) {
            this.insert(block);
        }
        block.next.insert(node); // 将节点移动到使用次数为 cnt + 1 的块中
        this.blockMap.set(key, block.next);
        if (block.isEmpty()) this.remove(block);
        return node.val;
    }

    /**
     * 更新缓存。<br/>
     * 如果是已有的缓存，进行更新；否则，新建一份缓存，如果容量超出，则移除使用次数最少且最久未使用的缓存
     * @param {any} key
     * @param {any} value
     */
    put(key, value) {
        if (this.capacity === 0) return;
        if (this.blockMap.has(key)) {
            this.nodeMap.get(key).val = value;
            this.get(key);
        } else {
            if (this.blockMap.size >= this.capacity) {
                let nodeToBeRemoved = this.head.next.tail.prev; // 使用次数最少的且最久未使用过的缓存节点

                console.log("fuck lfu drop", nodeToBeRemoved);
                // 从缓存中移除后，触发组件卸载过程
                const appName = nodeToBeRemoved.key;
                const eleInstance = elementInstanceMap.get(appName);
                eleInstance?.unmountProcedure();

                this.head.next.remove(nodeToBeRemoved);
                if (this.head.next.isEmpty()) {
                    this.remove(this.head.next);
                }

                this.blockMap.delete(nodeToBeRemoved.key);
                this.nodeMap.delete(nodeToBeRemoved.key);
            }
            let p = new Node(key, value);
            if (this.head.next.cnt > 1) this.insert(this.head);
            this.head.next.insert(p);
            this.blockMap.set(key, this.head.next);
            this.nodeMap.set(key, p);
        }
    }

    /**
     * 在 p 的右侧插入一个 cnt == p.cnt + 1 的新块
     * @param {Block} p
     */
    insert(p) {
        let cur = new Block(p.cnt + 1);
        cur.next = p.next;
        cur.next.prev = cur;
        p.next = cur;
        cur.prev = p;
    }

    /**
     * 删除一个块
     * @param {Block} p
     */
    remove(p) {
        p.next.prev = p.prev;
        p.prev.next = p.next;
    }


    /** 劫持 Map 部分原生的方法 **/

    set(key, value) {
        this.put(key, value);
    }

    has(key) {
        return this.blockMap.has(key);
    }

    delete(key) {
        let block = this.blockMap.get(key);
        let node = this.nodeMap.get(key);
        block.remove(node);
        if (block.isEmpty()) {
            this.remove(block);
        }
        this.blockMap.delete(key);
        this.nodeMap.delete(key);
    }

    get size() {
        return this.blockMap.size;
    }

    keys() {
        return this.nodeMap.keys();
    }

    values() {
        return [...this.nodeMap.values()].map(node => node.val);
    }
}

export default LFUCache;

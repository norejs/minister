/**
 * 双向链表中的节点
 */
export default class Node {
    /**
     * 前向指针
     * @type {(null|Node)}
     */
    prev = null;
    /**
     * 后向指针
     * @type {(null|Node)}
     */
    next = null;

    constructor(key, val) {
        this.key = key;
        this.val = val;
    }
}

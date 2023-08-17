import {
    globalThis as root,
    get,
    run,
    value,
    flatten,
} from "../utils";
import { isFunction, isExist } from "./is";

function isScrollableNode(node = {}) {
    if (!isExist(node)) {
        return false;
    }

    return (
        node.scrollWidth > node.clientWidth || node.scrollHeight > node.clientHeight
    );
}

function getScrollableNodes(from) {
    if (!isFunction(get(root, "document.querySelectorAll"))) {
        return [];
    }

    return [...value(run(from, "querySelectorAll", "*"), []), from].filter(
        isScrollableNode,
    );
}

// 找到 from 下所有发生了滚动的元素，保存它们的位置，并返回一个恢复滚动位置的函数
export default function saveScrollPosition(from) {
    // 找到所有发生了滚动的元素
    const nodes = [...new Set([...flatten(from.map(getScrollableNodes))])];

    // 存储发生滚动的元素的滚动位置
    const saver = nodes.map((node) => [
        node,
        {
            x: node.scrollLeft,
            y: node.scrollTop,
        },
    ]);

    // 返回一个恢复滚动位置的函数
    return function revert() {
        saver.forEach(([node, { x, y }]) => {
            node.scrollLeft = x;
            node.scrollTop = y;
        });
    };
}

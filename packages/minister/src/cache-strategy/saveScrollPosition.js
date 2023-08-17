import { isUndefined, isNull, flatten } from "../libs/utils";

function isScrollableNode(node) {
    if (isUndefined(node) || isNull(node)) return;

    return (
        node.scrollWidth > node.clientWidth ||
        node.scrollHeight > node.clientHeight
    );
}

function getAllScrollNode(container) {
    if (!container.querySelectorAll) return [];

    return [...container.querySelectorAll("*")].filter(isScrollableNode);
}

export default function saveScrollPosition(container = []) {
    const nodes = [...new Set(flatten(container.map(getAllScrollNode)))];

    const saver = nodes.map(node => {
        return [
            node,
            {
                x: node.scrollLeft,
                y: node.scrollTop,
            }
        ];
    });

    return function revert() {
        saver.forEach(([node, { x, y }]) => {
            node.scrollLeft = x;
            node.scrollTop = y;
        });
    };
}

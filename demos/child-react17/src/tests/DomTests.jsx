import React, { useEffect } from 'react';
function useDomTest() {
    const appendDom = () => {
        const div = document.createElement('div');
        div.innerHTML = 'Append DOM';
        document.body.appendChild(div);
        return div;
    };
    useEffect(() => {
        const div = appendDom();
        // 判断是否在浏览器环境
        return () => {
            console.log('useDomTest cleanup');
            document.body.removeChild(div);
        };
    }, []);
}
export default function DomTests() {
    useDomTest();
    return (
        <div>
            <h1>DOM Tests</h1>
        </div>
    );
}

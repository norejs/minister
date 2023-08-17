import React from "react";
import "./index.scss";
import img from "../../images/img.png";

// 测试DOM 获取是否正确
function checkQueryDom() {
    const queryMethod = [];
    const body = document.body;
    const head = document.head;
}

checkQueryDom();

export function Child() {
    return (
        <div>
            <h1>Home</h1>
            <p>Home</p>
            <a href="#/about">about</a>
            <img width={100} src={img} alt="" />
            <button
                onClick={() => {
                    window.location.href = "#/about";
                }}
            >
                跳转到about
            </button>
        </div>
    );
}

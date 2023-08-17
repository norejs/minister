// 全局导入 webComponent
// import "../coustomElement/userCard.js";
import { Counter } from "./Expenses";

export default function UserCard() {
    return (
        <main style={{ padding: "1rem 0" }}>
            UserCard
            <Counter />
            {/* 此处样式不受下面template内style影响 */}
            {/* <img src="https://semantic-ui.com/images/avatar2/large/kristy.png" alt="" srcset="" className="image"/> */}
            {/* <user-card
        image="https://semantic-ui.com/images/avatar2/large/kristy.png"
        name="User Name"
        email="yourmail@some-email.com"
      ></user-card> */}
        </main>
    );
}

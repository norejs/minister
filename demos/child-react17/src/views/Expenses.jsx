import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useParams } from "react-router";

export default function Expenses() {
    return (
        <main style={{ padding: "1rem 0", overflowY: "auto", height: 200 }}>
            <h2>Expenses</h2>
            <Counter />
            <List />
        </main>
    );
}

export function Counter() {
    const [count, setCount] = useState(0);

    const increment = () => {
        setCount(count + 1);
    };

    const decrement = () => {
        setCount(count - 1);
    };

    return (
        <>
            <div>
                count: {count}
            </div>
            <button onClick={increment}>inc</button>
            <button onClick={decrement}>dec</button>
        </>
    );
}


export function Item() {
    const params = useParams();
    const navigate = useNavigate();

    return (
        <div>
            <div>
                <button
                    onClick={() => {
                        navigate(-1);
                    }}
                >
                    Go Back
                </button>
            </div>
            Item View id: {params.id}
            <Counter />
        </div>
    );
}

function List() {
    return (
        <div className="list">
            {
                Array(100).fill(0).map((value, index) => {
                    return (
                        <div key={index}>
                            <Link to={`item/${index}`}>{`To item ${index}`}</Link>
                        </div>
                    );
                })
            }
        </div>
    );
}

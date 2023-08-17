import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Invoice() {
    const [test, setTest] = useState(0);
    let params = useParams();
    useEffect(() => {
        setTest("myTest");
    }, []);
    return <h2>Invoice : {params.invoiceId} {test}</h2>;
}

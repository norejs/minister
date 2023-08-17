import { createRoot } from "react-dom/client";
import { Child } from "./pages/Child";
import { createHashRouter, RouterProvider } from "react-router-dom";
import { About } from "./pages/About";
const router = createHashRouter([
    {
        path: "/",
        element: <Child />,
    },
    {
        path: "/about",
        element: <About />,
    },
]);
const container = document.getElementById("root");
console.log("container", window, document, container);
const root = createRoot(container);
root.render(<RouterProvider router={router} />);

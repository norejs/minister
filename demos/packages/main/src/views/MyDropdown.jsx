import React, { useCallback } from "react";

// npm install road-dropdown 这里相当于就是 Dropdown的内部定义
// import "road-dropdown";

const Dropdown = ({ label, option, options, onChange }) => {
    // const ref = React.createRef();
    // @see https://zh-hans.reactjs.org/docs/hooks-reference.html#uselayouteffect
    // React.useLayoutEffect(() => {
    //   const handleChange = (customEvent) => onChange(customEvent.detail);

    //   ref.current.addEventListener("onChange", handleChange);

    //   return () => ref.current.removeEventListener("onChange", handleChange);
    // }, []);

    return (
        // <road-dropdown
        //   ref={ref}
        //   label={label}
        //   option={option}
        //   options={JSON.stringify(options)}
        //   onChange={onChange}
        // />
        <div>
            我是父应用自己的下拉框组件
            {/* <mini-app
        baseroute="/dropdown"
        name="react-child"
        url="http://localhost:3001/"
        onCreated={(e) => console.log("react-child-1被创建", e)}
        // keep-alive
      ></mini-app> */}
        </div>
    );
};

const MyDropdown = () => {
    const onChange = useCallback(value => {
        console.log(value);
    }, []);
    return (
        <Dropdown
            label={"我的下拉框"}
            option={"option2"}
            options={{
                option1: { label: "Option 1" },
                option2: { label: "Option 2" },
                option3: { label: "Option 3" },
                option4: { label: "Option 4" },
                option5: { label: "Option 5" },
                option6: { label: "Option 6" },
            }}
            onChange={onChange}
        ></Dropdown>
    );
};
export default MyDropdown;

/**
 * 在react jsx被解析的时候  添加自定义事件监听， （如从type为micro-app 的props上找到所有的符合eventLifeCycles中的挂载方法 如oncreated ） 然后在app的合适的生命周期的时机，被触发
 */
const React = require('react');
// 定义合法的 lifecycles
const eventLifeCycles = ['oncreated', 'onbeforemount', 'onmounted', 'onunmount', 'onerror', 'ondatachange', 'onbeforeshow', 'onaftershow', 'onafterhidden'];
function jsxCustomEvent(type, props, ...children) {
  if (typeof type !== 'string' || !/^micro-app(-\S+)?/.test(type) || !props) {
    return React.createElement.apply(null, [type, props, ...children]);
  }
  const newProps = Object.assign({}, props);
  // 包装回调ref， ref 会被调用当 create, update, unmount 
  // element 是一个dom对象
  // @see https://zh-hans.reactjs.org/docs/refs-and-the-dom.html#callback-refs
  newProps.ref = element => {
    if (typeof props.ref === 'function') {
      props.ref(element);
    } else if (typeof props.ref === 'object') {
      props.ref.current = element;
    }
    // React 将在组件挂载时，会调用 ref 回调函数并传入 DOM 元素，当卸载时调用它并传入 null。
    if (element) {
      // 【数据通信预留】当前一个和下一个数据不一致时，更新数据 
      if (toString.call(props.data) === '[object Object]' && element.data !== props.data) {
        element.data = props.data;
      }
      for (const key in props) {
        // 从eventLifeCycles中找到符合要求的钩子函数
        if (Object.prototype.hasOwnProperty.call(props, key) && eventLifeCycles.includes(key.toLowerCase()) && typeof props[key] === 'function' && (!element[key] || element[key] !== props[key])) {
          // 解析onCreated字符 => 添加created事件监听
          const eventName = key.toLowerCase().replace('on', '');
          if (element[key]) {
            // 先移除事件监听
            element.removeEventListener(eventName, element[key], false);
          }
          // 添加事件监听 
          element.addEventListener(eventName, props[key], false);
          // 将props属性全部挂载到dom对象属性上
          element[key] = props[key];
        }
      }
    }
  };
  return React.createElement.apply(null, [type, newProps, ...children]);
}

export default jsxCustomEvent;
export { jsxCustomEvent };

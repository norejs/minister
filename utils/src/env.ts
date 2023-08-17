let IS_RUNTIME_DEBUG = false;
let IS_TEST_HOST = false;
try {
    IS_RUNTIME_DEBUG = localStorage.getItem("PAJK_MALL_DEBUG") !== null;
    IS_TEST_HOST = window.location.host.indexOf(".test.") > -1 || window.location.host.indexOf("localhost") > -1;
} catch (error) {}

export { IS_RUNTIME_DEBUG as IS_RUNTIME_DEBUG };
export { IS_TEST_HOST as IS_TEST_HOST };

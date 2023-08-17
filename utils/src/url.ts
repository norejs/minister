export function isAbsoluteUrl(url: string) {
    return /^https?:\/\//.test(url) || /^\/\//.test(url);
}

function getBaseUrl(fullUrl) {
    try {
        const url = new URL(fullUrl);
        console.log("getBaseUrl", url.protocol, url.host, url.pathname);
        return (url.protocol || location.protocol) + "//" + url.host + url.pathname.replace(/\/[^\/]*$/, "");
    } catch (error) {
        return "";
    }
}

export function isRelativeUrl(url: string, baseUrl: string = "") {
    console.log("isRelativeUrl", url, baseUrl, getBaseUrl(baseUrl));
    return (baseUrl && url.startsWith(getBaseUrl(baseUrl))) || !isAbsoluteUrl(url);
}

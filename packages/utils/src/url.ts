export function isAbsoluteUrl(url: string) {
    return /^https?:\/\//.test(url) || /^\/\//.test(url);
}

function getBaseUrl(fullUrl) {
    try {
        const url = new URL(fullUrl);
        return (url.protocol || location.protocol) + "//" + url.host + url.pathname.replace(/\/[^\/]*$/, "");
    } catch (error) {
        return "";
    }
}

export function isRelativeUrl(url: string, baseUrl: string = "") {
    return (baseUrl && url.startsWith(getBaseUrl(baseUrl))) || !isAbsoluteUrl(url);
}

export function isAbsoluteUrl(url: string) {
    return /^https?:\/\//.test(url) || /^\/\//.test(url);
}

export function isRelativeUrl(url: string, baseUrl: string = "") {
    return (baseUrl && url.startsWith(baseUrl)) || !isAbsoluteUrl(url);
}

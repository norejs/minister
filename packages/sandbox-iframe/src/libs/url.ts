export function isAbsoluteUrl(url: string) {
    return /^https?:\/\//.test(url) || /^\/\//.test(url);
}

export function isRelativeUrl(url: string, baseUrl: string = '') {
    return (baseUrl && url.startsWith(baseUrl)) || !isAbsoluteUrl(url);
}

export function isOnlyHashDiffrent(url: string, baseUrl: string = '') {
    if(url.startsWith('#')){
        return true;
    }
    const urlObj = new URL(url);
    const baseUrlObj = new URL(baseUrl);
    return (
        urlObj.pathname === baseUrlObj.pathname &&
        urlObj.search === baseUrlObj.search &&
        urlObj.origin === baseUrlObj.origin &&
        urlObj.hash !== baseUrlObj.hash
    );
}

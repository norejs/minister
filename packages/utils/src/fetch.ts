export function fetchContent(url: string, global = window): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const xhr = new global.XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    resolve(xhr.responseText);
                } else {
                    reject(new Error(`Failed to load script: ${url}`));
                }
            }
        };
        xhr.send();
    });
}

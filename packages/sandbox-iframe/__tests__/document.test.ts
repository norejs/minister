import MDocument from '../src/modules/document';
/**
 * @jest-environment jsdom
 */
let iframe: HTMLIFrameElement;
let iframeWindow: Window;
let iframeDocument: Document;
let rootElement: HTMLElement;
let myDocument: MDocument;
let sandboxDocument: Document;
const onAddElement = jest.fn();
/**
 * 初始化 myDocument
 */
beforeAll(() => {
    iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    iframeWindow = iframe.contentWindow as Window;
    iframeDocument = iframeWindow?.document;
    rootElement = iframeDocument.createElement('div');
    rootElement.id = 'root';
    rootElement.innerHTML = `<mini-app-head></mini-app-head><mini-app-body></mini-app-body>`;
    document.body.appendChild(rootElement);
    myDocument = new MDocument(iframeDocument as Document, {
        rootElement,
        rawWindow: iframeWindow as Window,
        onAddElement,
    });
    sandboxDocument = myDocument.proxy as unknown as Document;
});
test('init MDocument', () => {
    expect(myDocument).toBeInstanceOf(MDocument);
});

test('query body', () => {
    expect(sandboxDocument.body.tagName).toBe('MINI-APP-BODY');
    expect(sandboxDocument.querySelector('body')).toBeInstanceOf(iframeWindow.HTMLElement);
});

test('query head', () => {
    expect(sandboxDocument.head.tagName).toBe('MINI-APP-HEAD');
    expect(sandboxDocument.querySelector('head')).toBeInstanceOf(iframeWindow.HTMLElement);
});

test('insert dom', () => {
    const div = sandboxDocument.createElement('div');
    div.id = 'div';
    sandboxDocument.body.appendChild(div);
    expect(rootElement.contains(div)).toBe(true);
    // insertBefore
    const div2 = sandboxDocument.createElement('div');
    div2.id = 'div2';
    sandboxDocument.body.insertBefore(div2, div);
    expect(rootElement.contains(div2)).toBe(true);
    expect(onAddElement).toBeCalled();
});

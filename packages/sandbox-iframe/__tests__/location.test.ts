import MLocation from '../src/modules/location';

let iframe: HTMLIFrameElement;
let iframeWindow: Window;
let iframeDocument: Document;
let iframeLocation: Location;
let myLocation: MLocation;
let locationProxy: Location;
beforeAll(() => {
    iframe = document.createElement('iframe');
    const url = 'about:blank';
    iframe.src = url;
    document.body.appendChild(iframe);
    iframeWindow = iframe.contentWindow as Window;
    iframeDocument = iframeWindow?.document;
    iframeLocation = iframeWindow?.location;
    myLocation = new MLocation(iframeLocation, {
        parentLocation: window.location,
        url: 'http://localhost:3000',
        onRedirect: (url) => {
            return true;
        },
    });
    locationProxy = myLocation.proxy as unknown as Location;
});

test('init MLocation', () => {
    expect(myLocation).toBeDefined();
});

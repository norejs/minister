import MIframe from "./iframe";
type ISandboxOptions = {
    rootElement: HTMLElement;
    appName: string;
    url: string;
    scripts?: string[];
    onReady?: () => void;
    onMessage?: (event: MessageEvent) => void;
    onError?: (event: ErrorEvent) => void;
    onUnload?: (event: Event) => void;
    onBeforeUnload?: (event: BeforeUnloadEvent) => void;
    onHashChange?: (event: HashChangeEvent) => void;
    onPopState?: (event: PopStateEvent) => void;
};
export default class Sandbox {
    private options: ISandboxOptions;
    private sandboxContainer: MIframe;
    constructor(options: ISandboxOptions) {
        this.options = options;
        this.init();
    }
    private init() {
        this.sandboxContainer = new MIframe(this.options);
    }
    getRootElement() {
        return this.sandboxContainer.getRootElement();
    }
    execScriptCode(code: string, withSandBox = true, url: string = "") {
        this.sandboxContainer.execScriptCode(code, withSandBox, url);
    }
    execUrlScript(url: string, withSandBox = true) {
        this.sandboxContainer.execUrlScript(url, withSandBox);
    }
    execScript(script: HTMLScriptElement, withSandBox = true) {
        this.sandboxContainer.execScript(script);
    }
    destroy() {
        this.sandboxContainer.destroy();
    }
}

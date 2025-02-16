import { JSDOM } from "jsdom";

export class DOMBuilder {
  private dom: JSDOM;

  constructor() {
    this.dom = new JSDOM();
  }

  createElement(
    tag: string,
    attributes: Record<string, string> = {},
  ): HTMLElement {
    const element = this.dom.window.document.createElement(tag);
    this.setAttributes(element, attributes);
    return element;
  }

  createScript(src?: string): HTMLScriptElement {
    const script = this.createElement("script") as HTMLScriptElement;
    if (src) {
      script.src = src;
    }
    return script;
  }

  createStyleSheet(): HTMLStyleElement {
    return this.createElement("style") as HTMLStyleElement;
  }

  private setAttributes(
    element: HTMLElement,
    attributes: Record<string, string>,
  ): void {
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }

  getDocument(): Document {
    return this.dom.window.document;
  }
}

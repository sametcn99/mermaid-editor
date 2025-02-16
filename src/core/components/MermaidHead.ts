import { IHTMLComponent } from "../interfaces/IHTMLComponent";
import { DOMBuilder } from "../utils/DOMBuilder";

export class MermaidHead implements IHTMLComponent {
  private builder: DOMBuilder;

  constructor(builder: DOMBuilder) {
    this.builder = builder;
  }

  render(): HTMLHeadElement {
    const head = this.builder.createElement("head") as HTMLHeadElement;
    head.appendChild(this.createMermaidScript());
    head.appendChild(this.createStyles());
    head.appendChild(this.createInitScript());
    return head;
  }

  private createMermaidScript(): HTMLScriptElement {
    return this.builder.createElement("script", {
      src: "https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js",
    }) as HTMLScriptElement;
  }

  private createStyles(): HTMLStyleElement {
    const style = this.builder.createElement("style") as HTMLStyleElement;
    style.textContent = `
      body { padding: 10px; }
      .mermaid {
        display: flex;
        justify-content: center;
        align-items: center;
      }
    `;
    return style;
  }

  private createInitScript(): HTMLScriptElement {
    const script = this.builder.createElement("script") as HTMLScriptElement;
    script.textContent = `
      mermaid.initialize({
        startOnLoad: true,
        theme: 'default',
        securityLevel: 'loose',
        logLevel: 'error',
      });
    `;
    return script;
  }
}

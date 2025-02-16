import { IHTMLComponent } from "../interfaces/IHTMLComponent";
import { StyleConfig } from "../interfaces/StyleConfig";
import { DOMBuilder } from "../utils/DOMBuilder";
import { styleConfigToCss } from "../utils/utils";

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
    style.setAttribute("type", "text/css");
    const mermaidStyles: StyleConfig[] = [
      {
        selector: "body",
        rules: {
          padding: "10px",
        },
      },
      {
        selector: ".mermaid",
        rules: {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        },
      },
    ];
    style.textContent =
      styleConfigToCss(mermaidStyles[0]) +
      "\n\n" +
      styleConfigToCss(mermaidStyles[1]);
    return style;
  }

  private createInitScript(): HTMLScriptElement {
    const script = this.builder.createElement("script") as HTMLScriptElement;
    script.textContent = `
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
          mermaid.initialize({
            startOnLoad: true,
            theme: 'default',
            securityLevel: 'loose',
            logLevel: 'error',
          });
          mermaid.init(undefined, document.querySelectorAll('.mermaid'));
        }, 500);
      });
    `;
    return script;
  }
}

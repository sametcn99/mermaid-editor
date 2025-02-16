import { IHTMLComponent } from "../interfaces/IHTMLComponent";
import { DOMBuilder } from "../utils/DOMBuilder";

export class MermaidBody implements IHTMLComponent {
  private builder: DOMBuilder;
  private mermaidText: string;

  constructor(builder: DOMBuilder, mermaidText: string) {
    this.builder = builder;
    this.mermaidText = mermaidText;
  }

  render(): HTMLBodyElement {
    const body = this.builder.createElement("body") as HTMLBodyElement;
    const mermaidDiv = this.builder.createElement("div", { class: "mermaid" });
    mermaidDiv.textContent = this.mermaidText;
    body.appendChild(mermaidDiv);
    
    return body;
  }
}

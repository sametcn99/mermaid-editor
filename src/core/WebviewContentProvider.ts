import * as vscode from "vscode";
import { DOMBuilder } from "./utils/DOMBuilder";
import { HTMLDocumentBuilder } from "./utils/HTMLDocumentBuilder";
import { MermaidHead } from "./components/MermaidHead";
import { MermaidBody } from "./components/MermaidBody";

export class WebviewContentProvider {
  private static instance: WebviewContentProvider;
  private builder: DOMBuilder;
  private documentBuilder: HTMLDocumentBuilder;
  private content: string = "";

  constructor() {
    this.builder = new DOMBuilder();
    this.documentBuilder = new HTMLDocumentBuilder();
  }

  public clearContent(): void {
    this.content = "";
    this.builder = new DOMBuilder(); // Reset builder
  }

  public getContent(mermaidText: string): string {
    if (!mermaidText.trim()) {
      return ""; // Return empty content if mermaidText is empty
    }

    const head = new MermaidHead(this.builder);
    const body = new MermaidBody(this.builder, mermaidText);
    const doc = this.documentBuilder.createDocument(head, body);
    this.content = doc.documentElement.outerHTML;
    return this.content;
  }

  public getCurrentContent(): string {
    return this.content;
  }
}

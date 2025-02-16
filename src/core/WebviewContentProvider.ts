import * as vscode from "vscode";
import { DOMBuilder } from "./utils/DOMBuilder";
import { HTMLDocumentBuilder } from "./utils/HTMLDocumentBuilder";
import { MermaidHead } from "./components/MermaidHead";
import { MermaidBody } from "./components/MermaidBody";

export class WebviewContentProvider {
  private static instance: WebviewContentProvider;
  private builder: DOMBuilder;
  private documentBuilder: HTMLDocumentBuilder;

  private constructor() {
    this.builder = new DOMBuilder();
    this.documentBuilder = new HTMLDocumentBuilder();
  }

  public static getInstance(): WebviewContentProvider {
    if (!WebviewContentProvider.instance) {
      WebviewContentProvider.instance = new WebviewContentProvider();
    }
    return WebviewContentProvider.instance;
  }

  public getContent(mermaidText: string): string {
    const head = new MermaidHead(this.builder);
    const body = new MermaidBody(this.builder, mermaidText);
    const doc = this.documentBuilder.createDocument(head, body);
    return doc.documentElement.outerHTML;
  }
}

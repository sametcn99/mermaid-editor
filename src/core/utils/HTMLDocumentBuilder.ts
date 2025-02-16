import { JSDOM } from "jsdom";
import { IHTMLComponent } from "../interfaces/IHTMLComponent";

export class HTMLDocumentBuilder {
  private dom: JSDOM;

  constructor() {
    this.dom = new JSDOM("<!DOCTYPE html><html></html>");
  }

  public createDocument(head: IHTMLComponent, body: IHTMLComponent): Document {
    const doc = this.dom.window.document;
    const html = doc.documentElement;

    html.appendChild(head.render());
    html.appendChild(body.render());

    return doc;
  }

  public getDocument(): Document {
    return this.dom.window.document;
  }
}

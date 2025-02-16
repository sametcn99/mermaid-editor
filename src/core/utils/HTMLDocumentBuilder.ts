import { JSDOM } from "jsdom";
import * as ejs from "ejs";
import * as fs from "fs";
import * as path from "path";

export class HTMLDocumentBuilder {
  private dom: JSDOM;
  private templatePath: string;
  private templateCache: Map<string, string> = new Map();

  constructor(basePath: string) {
    this.dom = new JSDOM();
    this.templatePath = path.join(basePath, "src", "core", "templates");
  }

  public createDocument(head: IHTMLComponent, body: IHTMLComponent): string {
    const document = this.dom.window.document;
    const html = document.createElement("html");
    const headElement = document.createElement("head");
    const bodyElement = document.createElement("body");

    headElement.innerHTML = head.render();
    bodyElement.innerHTML = body.render();

    html.appendChild(headElement);
    html.appendChild(bodyElement);

    return "<!DOCTYPE html>\n" + html.outerHTML;
  }

  public getDocument(): Document {
    return this.dom.window.document;
  }

  public async render(template: string, data: object): Promise<string> {
    const templateContent = await this.getTemplate(template);
    return ejs.render(templateContent, data);
  }

  private async getTemplate(name: string): Promise<string> {
    if (!this.templateCache.has(name)) {
      const fullPath = path.join(this.templatePath, `${name}.ejs`);
      const content = await fs.promises.readFile(fullPath, "utf-8");
      this.templateCache.set(name, content);
    }
    return this.templateCache.get(name)!;
  }

  public clearCache(): void {
    this.templateCache.clear();
  }
}

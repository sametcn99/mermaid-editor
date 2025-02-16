import * as vscode from "vscode";
import * as ejs from "ejs";
import * as path from "path";
import * as fs from "fs";
import { t } from "./utils/language";

interface ResourceUris {
  cssUri: string;
  fontAwesomeCssUri: string;
  webfontsUri: string;
  cspSource: string;
  scriptUri: string; // Add scriptUri to the interface
  mermaidUri: string; // Mermaid.js URI'sini ekledik
  monacoEditorRoot: string;
  monacoEditorUri: string;
  monacoEditorCssUri: string;
}

export class WebviewContentProvider {
  private static instance: WebviewContentProvider;
  private content: string = "";
  private templatePath: string;
  private readonly maxContentSize = 1024 * 1024; // 1MB limit

  constructor(context: vscode.ExtensionContext) {
    this.templatePath = path.join(
      context.extensionPath,
      "src",
      "core",
      "templates",
    );
    if (!fs.existsSync(this.templatePath)) {
      throw new Error(`Template directory not found at: ${this.templatePath}`);
    }
  }

  public clearContent(): void {
    this.content = "";
  }

  public getContent(mermaidText: string, resources?: ResourceUris): string {
    if (typeof mermaidText !== "string") {
      throw new Error("Invalid input: mermaidText must be a string");
    }

    if (mermaidText.length > this.maxContentSize) {
      throw new Error("Content exceeds maximum size limit of 1MB");
    }

    if (!mermaidText.trim()) {
      return this.renderError("No diagram content provided");
    }

    try {
      // Validate diagram syntax before rendering
      this.validateDiagramSyntax(mermaidText);

      const template = fs.readFileSync(
        path.join(this.templatePath, "webview.ejs"),
        "utf-8",
      );
      if (!template) {
        throw new Error("Template file is empty");
      }

      // Ensure all required resources are available
      if (!resources?.monacoEditorRoot) {
        throw new Error("Monaco Editor root path is required");
      }

      this.content = ejs.render(
        template,
        {
          content: mermaidText,
          mermaidText,
          t,
          errorHandler: this.handleError.bind(this),
          cssUri: resources?.cssUri,
          fontAwesomeCssUri: resources?.fontAwesomeCssUri,
          webfontsUri: resources?.webfontsUri,
          cspSource: resources?.cspSource,
          scriptUri: resources?.scriptUri, // Pass scriptUri to template
          mermaidUri: resources?.mermaidUri, // Mermaid URI'sini template'e gönder
          monacoEditorRoot: resources.monacoEditorRoot,
          monacoEditorUri: resources?.monacoEditorUri,
          monacoEditorCssUri: resources?.monacoEditorCssUri,
        },
        {
          root: this.templatePath, // Set the root directory for includes
          filename: path.join(this.templatePath, "webview.ejs"), // Set the filename for proper relative path resolution
        },
      );

      return this.content;
    } catch (error) {
      return this.renderError(
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  private validateDiagramSyntax(content: string): void {
    // Basic syntax validation
    const hasValidStart =
      /^\s*(graph|sequenceDiagram|classDiagram|stateDiagram|gantt|pie|flowchart|erDiagram)/m.test(
        content,
      );
    if (!hasValidStart) {
      throw new Error(
        "Invalid Mermaid diagram syntax: Must start with a valid diagram type",
      );
    }
  }

  private handleError(err: Error): string {
    vscode.window.showErrorMessage(`Mermaid rendering error: ${err.message}`);
    return this.renderError(err.message);
  }

  private renderError(message: string): string {
    return `<div class="error-message">Error: ${message}</div>`;
  }

  public getCurrentContent(): string {
    return this.content || "";
  }
}

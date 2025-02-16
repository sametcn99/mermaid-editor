import * as vscode from "vscode";
import * as ejs from "ejs";
import * as path from "path";
import * as fs from "fs";

export class WebviewContentProvider {
  private static instance: WebviewContentProvider;
  private content: string = "";
  private templatePath: string;

  constructor(context: vscode.ExtensionContext) {
    this.templatePath = path.join(context.extensionPath, 'src', 'core', 'templates', 'webview.ejs');
    // Validate template exists on initialization
    if (!fs.existsSync(this.templatePath)) {
      throw new Error(`Template file not found at: ${this.templatePath}`);
    }
  }

  public clearContent(): void {
    this.content = "";
  }

  public getContent(mermaidText: string): string {
    // Input validation
    if (typeof mermaidText !== "string") {
      throw new Error("Invalid input: mermaidText must be a string");
    }

    if (!mermaidText.trim()) {
      return "";
    }

    try {
      const template = fs.readFileSync(this.templatePath, "utf-8");

      // Validate template content
      if (!template) {
        throw new Error("Template file is empty");
      }

      this.content = ejs.render(template, {
        content: mermaidText,  // Add this line to pass content
        mermaidText,
        // Add error handling helper
        errorHandler: (err: Error) => {
          vscode.window.showErrorMessage(
            `Mermaid rendering error: ${err.message}`,
          );
          return "";
        },
      });

      return this.content;
    } catch (error) {
      // Log error and show user-friendly message
      console.error("Template rendering error:", error);
      vscode.window.showErrorMessage(
        `Failed to render Mermaid diagram: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return `<!-- Error rendering diagram: ${error instanceof Error ? error.message : "Unknown error"} -->`;
    }
  }

  public getCurrentContent(): string {
    return this.content || "";
  }
}

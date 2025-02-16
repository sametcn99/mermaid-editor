import * as vscode from 'vscode';
import * as ejs from 'ejs';
import * as path from 'path';
import * as fs from 'fs';
import { t } from './utils/language';
import { ResourceUris } from './interfaces';

export class WebviewContentProvider {
  private content: string = '';
  private templatePath: string;
  private readonly maxContentSize = 5 * 1024 * 1024; // 5MB limit

  constructor(context: vscode.ExtensionContext) {
    this.templatePath = path.join(context.extensionPath, 'src', 'core', 'webview');
    if (!fs.existsSync(this.templatePath)) {
      throw new Error(`Template directory not found at: ${this.templatePath}`);
    }
  }

  public clearContent(): void {
    this.content = '';
  }

  public getContent(mermaidText: string, resources?: ResourceUris): string {
    if (typeof mermaidText !== 'string') {
      throw new Error('Invalid input: mermaidText must be a string');
    }

    if (mermaidText.length > this.maxContentSize) {
      throw new Error('Content exceeds maximum size limit of 5MB');
    }

    try {
      const template = fs.readFileSync(path.join(this.templatePath, 'index.ejs'), 'utf-8');
      if (!template) {
        throw new Error('Template file is empty');
      }

      if (!resources?.monacoEditorRoot) {
        throw new Error('Monaco Editor root path is required');
      }

      this.content = ejs.render(
        template,
        {
          content: mermaidText,
          mermaidText,
          t,
          errorHandler: this.handleError.bind(this),
          ...resources,
        },
        {
          root: this.templatePath,
          filename: path.join(this.templatePath, 'index.ejs'),
        }
      );

      return this.content;
    } catch (error) {
      return this.renderError(error instanceof Error ? error.message : 'Unknown error');
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
    return this.content || '';
  }
}

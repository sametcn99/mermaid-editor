import * as vscode from 'vscode';
import { WebviewContentProvider } from './WebviewContentProvider';
import { EditorService } from './services/EditorService';
import { ExportService } from './services/ExportService';
import { WebviewService } from './services/WebviewService';

export class MermaidEditorExtension {
  private webviewProvider: WebviewContentProvider;
  private editorService: EditorService;
  private webviewService: WebviewService;
  private exportService: ExportService | undefined;
  private webviewPanel: vscode.WebviewPanel | undefined;

  constructor(private context: vscode.ExtensionContext) {
    this.webviewProvider = new WebviewContentProvider(context);
    this.editorService = new EditorService();
    this.webviewService = new WebviewService(context, this.webviewProvider);
  }

  public activate(): void {
    const customEditorProvider = vscode.window.registerCustomEditorProvider(
      'mermaid-editor',
      {
        resolveCustomTextEditor: this.resolveCustomTextEditor.bind(this),
      },
      {
        webviewOptions: { retainContextWhenHidden: false },
        supportsMultipleEditorsPerDocument: false,
      }
    );

    this.registerCommands();
    this.setupThemeChangeListener();
    this.context.subscriptions.push(customEditorProvider);
  }

  private setupThemeChangeListener(): void {
    vscode.window.onDidChangeActiveColorTheme(e => {
      if (this.webviewPanel) {
        this.webviewPanel.webview.postMessage({
          type: 'vscode-theme-changed',
          theme:
            e.kind === vscode.ColorThemeKind.Dark
              ? 'vscode-dark'
              : e.kind === vscode.ColorThemeKind.HighContrast
                ? 'vscode-high-contrast'
                : 'vscode-light',
        });
      }
    });
  }

  private async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    try {
      this.webviewPanel = webviewPanel;
      this.exportService = new ExportService(this.webviewPanel);

      const resources = this.webviewService.setupWebview(webviewPanel);
      const text = document.getText().trim();
      this.webviewService.updateContent(webviewPanel, text, resources);

      this.setupDocumentChangeListener(document, resources);
      this.setupMessageListener(document);
      this.setupDisposeListener();
    } catch (error) {
      console.error('Error rendering template:', error);
      vscode.window.showErrorMessage(
        `Error rendering template: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private setupDocumentChangeListener(document: vscode.TextDocument, resources: any): void {
    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document.uri.toString() === document.uri.toString() && this.webviewPanel) {
        const newText = e.document.getText().trim();
        this.webviewService.updateContent(this.webviewPanel, newText, resources);
      }
    });

    if (this.webviewPanel) {
      this.webviewPanel.onDidDispose(() => changeDocumentSubscription.dispose());
    }
  }

  private setupMessageListener(document: vscode.TextDocument): void {
    if (!this.webviewPanel) return;

    this.webviewPanel.webview.onDidReceiveMessage(async message => {
      switch (message.command) {
        case 'editorChange':
          await this.editorService.handleEditorChange(document, message.text);
          break;

        case 'export':
          await this.exportService?.handleExport(document, message.format);
          break;

        case 'exportComplete':
          await this.exportService?.handleExportComplete(
            message.format,
            message.data,
            message.filePath
          );
          break;

        case 'exportError':
          vscode.window.showErrorMessage(`Export failed: ${message.error}`);
          break;

        case 'format':
          await this.editorService.formatDocument(document);
          break;
      }
    });
  }

  private setupDisposeListener(): void {
    if (this.webviewPanel) {
      this.webviewPanel.onDidDispose(() => {
        this.webviewPanel = undefined;
        this.exportService = undefined;
      });
    }
  }

  private registerCommands(): void {
    this.context.subscriptions.push(
      vscode.commands.registerCommand('mermaid-editor.export.png', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          this.exportService?.handleExport(editor.document, 'png');
        }
      }),
      vscode.commands.registerCommand('mermaid-editor.export.svg', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          this.exportService?.handleExport(editor.document, 'svg');
        }
      })
    );
  }
}

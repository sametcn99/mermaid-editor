import * as vscode from 'vscode';
import { WebviewContentProvider } from './WebviewContentProvider';
import * as path from 'path';

export class MermaidEditorExtension {
  private webviewProvider: WebviewContentProvider;
  private webviewPanel: vscode.WebviewPanel | undefined;

  constructor(private context: vscode.ExtensionContext) {
    this.webviewProvider = new WebviewContentProvider(context);
  }

  public activate(): void {
    // Register custom editor provider
    const customEditorProvider = vscode.window.registerCustomEditorProvider(
      'mermaid-editor',
      {
        resolveCustomTextEditor: this.resolveCustomTextEditor.bind(this),
      },
      {
        webviewOptions: {
          retainContextWhenHidden: false,
        },
        supportsMultipleEditorsPerDocument: false,
      }
    );

    // Register commands
    this.registerCommands();

    // Listen for theme changes
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

    // Add to subscriptions
    this.context.subscriptions.push(customEditorProvider);
  }

  private async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    try {
      this.webviewPanel = webviewPanel;

      // Enable scripts in webview and set local resource roots
      const localResourceRoot = vscode.Uri.joinPath(
        this.context.extensionUri,
        'src',
        'core',
        'webview'
      );
      const fontAwesomeRoot = vscode.Uri.joinPath(
        this.context.extensionUri,
        'node_modules',
        '@fortawesome',
        'fontawesome-free'
      );
      const mermaidRoot = vscode.Uri.joinPath(
        this.context.extensionUri,
        'node_modules',
        'mermaid',
        'dist'
      );
      const monacoEditorRoot = vscode.Uri.joinPath(
        this.context.extensionUri,
        'node_modules',
        'monaco-editor',
        'min'
      );

      webviewPanel.webview.options = {
        enableScripts: true,
        localResourceRoots: [localResourceRoot, fontAwesomeRoot, mermaidRoot, monacoEditorRoot],
      };

      // Get URIs for resources
      const cssUri = webviewPanel.webview.asWebviewUri(
        vscode.Uri.joinPath(localResourceRoot, 'styles', 'index.css')
      );
      const fontAwesomeCssUri = webviewPanel.webview.asWebviewUri(
        vscode.Uri.joinPath(fontAwesomeRoot, 'css', 'all.min.css')
      );
      const webfontsUri = webviewPanel.webview.asWebviewUri(fontAwesomeRoot);
      const scriptUri = webviewPanel.webview.asWebviewUri(
        vscode.Uri.joinPath(localResourceRoot, 'scripts')
      );
      const mermaidUri = webviewPanel.webview.asWebviewUri(
        vscode.Uri.joinPath(mermaidRoot, 'mermaid.min.js')
      );
      const monacoEditorRootUri = webviewPanel.webview.asWebviewUri(monacoEditorRoot);

      // Set initial content with resource URIs
      const text = document.getText().trim();
      webviewPanel.webview.html = this.webviewProvider.getContent(text, {
        cssUri: cssUri.toString(),
        fontAwesomeCssUri: fontAwesomeCssUri.toString(),
        webfontsUri: webfontsUri.toString(),
        cspSource: webviewPanel.webview.cspSource,
        scriptUri: scriptUri.toString(),
        mermaidUri: mermaidUri.toString(),
        monacoEditorRoot: monacoEditorRootUri.toString(),
        monacoEditorUri: monacoEditorRootUri.toString() + '/vs/editor/editor.main.js',
        monacoEditorCssUri: monacoEditorRootUri.toString() + '/vs/editor/editor.index.css',
      });

      // Handle document changes
      const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
        if (e.document.uri.toString() === document.uri.toString()) {
          const newText = e.document.getText().trim();
          webviewPanel.webview.html = this.webviewProvider.getContent(newText, {
            cssUri: cssUri.toString(),
            fontAwesomeCssUri: fontAwesomeCssUri.toString(),
            webfontsUri: webfontsUri.toString(),
            cspSource: webviewPanel.webview.cspSource,
            scriptUri: scriptUri.toString(),
            mermaidUri: mermaidUri.toString(),
            monacoEditorRoot: monacoEditorRootUri.toString(),
            monacoEditorUri: monacoEditorRootUri.toString() + '/vs/editor/editor.main.js',
            monacoEditorCssUri: monacoEditorRootUri.toString() + '/vs/editor/editor.index.css',
          });
        }
      });

      // Handle messages from webview
      webviewPanel.webview.onDidReceiveMessage(async message => {
        switch (message.command) {
          case 'editorChange':
            const edit = new vscode.WorkspaceEdit();
            edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), message.text);
            await vscode.workspace.applyEdit(edit);
            break;

          case 'export':
            await this.handleExport(document, message.format);
            break;

          case 'exportComplete':
            try {
              const data =
                message.format === 'png'
                  ? Buffer.from(message.data, 'base64')
                  : Buffer.from(message.data);

              await vscode.workspace.fs.writeFile(vscode.Uri.file(message.filePath), data);
              vscode.window.showInformationMessage(
                `Exported diagram as ${message.format.toUpperCase()}`
              );
            } catch (error) {
              vscode.window.showErrorMessage(
                `Failed to save exported file: ${error instanceof Error ? error.message : String(error)}`
              );
            }
            break;

          case 'exportError':
            vscode.window.showErrorMessage(`Export failed: ${message.error}`);
            break;

          case 'format':
            await this.formatDocument(document);
            break;
        }
      });

      // Clean up on editor close
      webviewPanel.onDidDispose(() => {
        changeDocumentSubscription.dispose();
        this.webviewPanel = undefined;
      });
    } catch (error) {
      console.error('Error rendering template:', error);
      vscode.window.showErrorMessage(
        `Error rendering template: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private registerCommands(): void {
    // Register any additional commands
    this.context.subscriptions.push(
      vscode.commands.registerCommand('mermaid-editor.export.png', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          this.handleExport(editor.document, 'png');
        }
      }),
      vscode.commands.registerCommand('mermaid-editor.export.svg', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          this.handleExport(editor.document, 'svg');
        }
      })
    );
  }

  private async handleExport(document: vscode.TextDocument, format: 'png' | 'svg'): Promise<void> {
    try {
      if (!this.webviewPanel) {
        throw new Error('No active webview panel');
      }

      // Get the file name without extension
      const fileName = path.parse(document.fileName).name;

      // Show save dialog
      const filters: { [key: string]: string[] } =
        format === 'png' ? { 'PNG Images': ['png'] } : { 'SVG Images': ['svg'] };

      const saveUri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(`${fileName}.${format}`),
        filters,
        title: `Export as ${format.toUpperCase()}`,
        saveLabel: `Export ${format.toUpperCase()}`,
      });

      if (saveUri) {
        // Request diagram content from webview
        this.webviewPanel.webview.postMessage({
          command: 'requestExport',
          format,
          filePath: saveUri.fsPath,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(
        `Failed to export as ${format.toUpperCase()}: ${errorMessage}`
      );
    }
  }

  private async formatDocument(document: vscode.TextDocument): Promise<void> {
    try {
      // Get the document text
      const text = document.getText();

      // Format using Prettier if installed
      const prettier = await import('prettier');
      const formatted = await prettier.format(text, {
        parser: 'markdown',
        printWidth: 80,
        proseWrap: 'preserve',
      });

      // Apply the formatting
      const edit = new vscode.WorkspaceEdit();
      edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), formatted);

      await vscode.workspace.applyEdit(edit);
      vscode.window.showInformationMessage('Document formatted successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Failed to format document: ${errorMessage}`);

      // Fallback to basic formatting if Prettier fails
      try {
        const text = document.getText();
        const lines = text.split('\n');
        const formattedLines = lines.map(line => line.trim());
        const formatted = formattedLines.join('\n');

        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), formatted);

        await vscode.workspace.applyEdit(edit);
        vscode.window.showInformationMessage('Document formatted with basic formatter');
      } catch (fallbackError) {
        vscode.window.showErrorMessage('Failed to apply basic formatting');
      }
    }
  }
}

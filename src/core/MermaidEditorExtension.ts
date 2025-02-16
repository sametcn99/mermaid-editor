import * as vscode from "vscode";
import { WebviewContentProvider } from "./WebviewContentProvider";
import * as path from "path";

export class MermaidEditorExtension {
  private webviewProvider: WebviewContentProvider;
  private webviewPanel: vscode.WebviewPanel | undefined;

  constructor(private context: vscode.ExtensionContext) {
    this.webviewProvider = new WebviewContentProvider(context);
  }

  public activate(): void {
    // Register custom editor provider
    const customEditorProvider = vscode.window.registerCustomEditorProvider(
      "mermaid-editor",
      {
        resolveCustomTextEditor: this.resolveCustomTextEditor.bind(this),
      },
      {
        webviewOptions: {
          retainContextWhenHidden: false,
        },
        supportsMultipleEditorsPerDocument: false,
      },
    );

    // Register commands
    this.registerCommands();

    // Listen for theme changes
    vscode.window.onDidChangeActiveColorTheme((e) => {
      if (this.webviewPanel) {
        this.webviewPanel.webview.postMessage({
          type: "vscode-theme-changed",
          theme:
            e.kind === vscode.ColorThemeKind.Dark
              ? "vscode-dark"
              : e.kind === vscode.ColorThemeKind.HighContrast
                ? "vscode-high-contrast"
                : "vscode-light",
        });
      }
    });

    // Add to subscriptions
    this.context.subscriptions.push(customEditorProvider);
  }

  private async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken,
  ): Promise<void> {
    try {
      this.webviewPanel = webviewPanel;

      // Enable scripts in webview and set local resource roots
      const localResourceRoot = vscode.Uri.joinPath(
        this.context.extensionUri,
        "src",
        "core",
        "templates",
      );
      const fontAwesomeRoot = vscode.Uri.joinPath(
        this.context.extensionUri,
        "node_modules",
        "@fortawesome",
        "fontawesome-free",
      );

      webviewPanel.webview.options = {
        enableScripts: true,
        localResourceRoots: [localResourceRoot, fontAwesomeRoot],
      };

      // Get URIs for resources
      const cssUri = webviewPanel.webview.asWebviewUri(
        vscode.Uri.joinPath(localResourceRoot, "styles", "main.css"),
      );
      const fontAwesomeCssUri = webviewPanel.webview.asWebviewUri(
        vscode.Uri.joinPath(fontAwesomeRoot, "css", "all.min.css"),
      );
      const webfontsUri = webviewPanel.webview.asWebviewUri(fontAwesomeRoot);
      const scriptUri = webviewPanel.webview.asWebviewUri(
        vscode.Uri.joinPath(localResourceRoot, "scripts"),
      );

      // Set initial content with resource URIs
      const text = document.getText().trim();
      webviewPanel.webview.html = this.webviewProvider.getContent(text, {
        cssUri: cssUri.toString(),
        fontAwesomeCssUri: fontAwesomeCssUri.toString(),
        webfontsUri: webfontsUri.toString(),
        cspSource: webviewPanel.webview.cspSource,
        scriptUri: scriptUri.toString(),
      });

      // Handle document changes
      const changeDocumentSubscription =
        vscode.workspace.onDidChangeTextDocument((e) => {
          if (e.document.uri.toString() === document.uri.toString()) {
            const newText = e.document.getText().trim();
            webviewPanel.webview.html = this.webviewProvider.getContent(
              newText,
              {
                cssUri: cssUri.toString(),
                fontAwesomeCssUri: fontAwesomeCssUri.toString(),
                webfontsUri: webfontsUri.toString(),
                cspSource: webviewPanel.webview.cspSource,
                scriptUri: scriptUri.toString(),
              },
            );
          }
        });

      // Handle webview messages
      webviewPanel.webview.onDidReceiveMessage((message) => {
        switch (message.command) {
          case "export":
            this.handleExport(document, message.format as "png" | "svg");
            break;
          case "format":
            this.formatDocument(document);
            break;
        }
      });

      // Clean up on editor close
      webviewPanel.onDidDispose(() => {
        changeDocumentSubscription.dispose();
        this.webviewPanel = undefined;
      });
    } catch (error) {
      console.error("Error rendering template:", error);
      vscode.window.showErrorMessage(
        `Error rendering template: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private registerCommands(): void {
    // Register any additional commands
    this.context.subscriptions.push(
      vscode.commands.registerCommand("mermaid-editor.export.png", () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          this.handleExport(editor.document, "png");
        }
      }),
      vscode.commands.registerCommand("mermaid-editor.export.svg", () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          this.handleExport(editor.document, "svg");
        }
      }),
    );
  }

  private async handleExport(
    document: vscode.TextDocument,
    format: "png" | "svg",
  ): Promise<void> {
    try {
      // Implementation for export functionality
      // This will be implemented when we add export features
      vscode.window.showInformationMessage(
        `Exporting as ${format.toUpperCase()}...`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(
        `Failed to export as ${format.toUpperCase()}: ${errorMessage}`,
      );
    }
  }

  private async formatDocument(document: vscode.TextDocument): Promise<void> {
    try {
      // Implementation for formatting functionality
      // This will be implemented when we add formatting features
      vscode.window.showInformationMessage("Formatting document...");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(
        `Failed to format document: ${errorMessage}`,
      );
    }
  }
}

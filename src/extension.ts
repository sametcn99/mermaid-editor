import * as vscode from "vscode";
import { WebviewContentProvider } from "./core/WebviewContentProvider";

export function activate(context: vscode.ExtensionContext) {
  // Register custom editor provider
  const customEditorProvider = vscode.window.registerCustomEditorProvider(
    "mermaid-editor",
    {
      async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken,
      ) {
        try {
          const provider = new WebviewContentProvider(context);

          // Set initial content only if document has content
          const text = document.getText().trim();
          if (text) {
            webviewPanel.webview.html = provider.getContent(text);
          }

          // Add editor title menu item
          webviewPanel.webview.options = { enableScripts: true };

          // Handle document changes
          const changeDocumentSubscription =
            vscode.workspace.onDidChangeTextDocument((e) => {
              if (e.document.uri.toString() === document.uri.toString()) {
                const newText = e.document.getText().trim();
                webviewPanel.webview.html = provider.getContent(newText);
              }
            });

          // Clean up when the editor is closed
          webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
          });
        } catch (error) {
          console.error("Error rendering template:", error);
          vscode.window.showErrorMessage(
            `Error rendering template: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },
    },
    {
      webviewOptions: {
        retainContextWhenHidden: false, // Changed to false to prevent content retention
      },
      supportsMultipleEditorsPerDocument: false,
    },
  );

  // Register title bar button contribution
  context.subscriptions.push(
    vscode.window.registerWebviewPanelSerializer("mermaid-editor", {
      async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel) {
        webviewPanel.webview.options = { enableScripts: true };
      },
    }),
  );
  context.subscriptions.push(customEditorProvider);
}

export function deactivate() {}

import * as vscode from "vscode";
import { WebviewContentProvider } from "./core/WebviewContentProvider";

export function activate(context: vscode.ExtensionContext) {
  const provider = WebviewContentProvider.getInstance();

  // Register custom editor provider
  const customEditorProvider = vscode.window.registerCustomEditorProvider(
    "mermaid-editor",
    {
      async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken,
      ) {
        // Set initial content
        webviewPanel.webview.html = provider.getContent(document.getText());

        // Add editor title menu item
        webviewPanel.webview.options = { enableScripts: true };

        // Handle document changes
        const changeDocumentSubscription =
          vscode.workspace.onDidChangeTextDocument((e) => {
            if (e.document.uri.toString() === document.uri.toString()) {
              webviewPanel.webview.html = provider.getContent(
                e.document.getText(),
              );
            }
          });

        // Clean up when the editor is closed
        webviewPanel.onDidDispose(() => {
          changeDocumentSubscription.dispose();
        });
      },
    },
    {
      webviewOptions: {
        retainContextWhenHidden: true,
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

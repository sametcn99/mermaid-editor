import * as vscode from 'vscode';
import { WebviewContentProvider } from '../WebviewContentProvider';
import { ResourceUris, WebviewServiceResources } from '../interfaces';

export class WebviewService {
  constructor(
    private context: vscode.ExtensionContext,
    private contentProvider: WebviewContentProvider
  ) {}

  public setupWebview(webviewPanel: vscode.WebviewPanel): WebviewServiceResources {
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

    return {
      cssUri: webviewPanel.webview.asWebviewUri(
        vscode.Uri.joinPath(localResourceRoot, 'styles', 'index.css')
      ),
      fontAwesomeCssUri: webviewPanel.webview.asWebviewUri(
        vscode.Uri.joinPath(fontAwesomeRoot, 'css', 'all.min.css')
      ),
      webfontsUri: webviewPanel.webview.asWebviewUri(fontAwesomeRoot),
      scriptUri: webviewPanel.webview.asWebviewUri(
        vscode.Uri.joinPath(localResourceRoot, 'scripts')
      ),
      mermaidUri: webviewPanel.webview.asWebviewUri(
        vscode.Uri.joinPath(mermaidRoot, 'mermaid.min.js')
      ),
      monacoEditorRoot: webviewPanel.webview.asWebviewUri(monacoEditorRoot),
    };
  }

  public updateContent(
    webviewPanel: vscode.WebviewPanel,
    text: string,
    resources: WebviewServiceResources
  ): void {
    const resourceUris: ResourceUris = {
      cssUri: resources.cssUri.toString(),
      fontAwesomeCssUri: resources.fontAwesomeCssUri.toString(),
      webfontsUri: resources.webfontsUri.toString(),
      cspSource: webviewPanel.webview.cspSource,
      scriptUri: resources.scriptUri.toString(),
      mermaidUri: resources.mermaidUri.toString(),
      monacoEditorRoot: resources.monacoEditorRoot.toString(),
      monacoEditorUri: resources.monacoEditorRoot.toString() + '/vs/editor/editor.main.js',
      monacoEditorCssUri: resources.monacoEditorRoot.toString() + '/vs/editor/editor.index.css',
    };

    webviewPanel.webview.html = this.contentProvider.getContent(text, resourceUris);
  }
}

import * as vscode from 'vscode';
import * as path from 'path';

export class ExportService {
  constructor(private webviewPanel: vscode.WebviewPanel | undefined) {}

  public async handleExport(document: vscode.TextDocument, format: 'png' | 'svg'): Promise<void> {
    try {
      if (!this.webviewPanel) {
        throw new Error('No active webview panel');
      }

      const fileName = path.parse(document.fileName).name;
      const filters: { [key: string]: string[] } =
        format === 'png' ? { 'PNG Images': ['png'] } : { 'SVG Images': ['svg'] };

      const saveUri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(`${fileName}.${format}`),
        filters,
        title: `Export as ${format.toUpperCase()}`,
        saveLabel: `Export ${format.toUpperCase()}`,
      });

      if (saveUri) {
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

  public async handleExportComplete(format: string, data: string, filePath: string): Promise<void> {
    try {
      const buffer = format === 'png' ? Buffer.from(data, 'base64') : Buffer.from(data);
      await vscode.workspace.fs.writeFile(vscode.Uri.file(filePath), buffer);
      vscode.window.showInformationMessage(`Exported diagram as ${format.toUpperCase()}`);
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to save exported file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

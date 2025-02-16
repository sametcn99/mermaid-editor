import { formatDocument } from '../utils/formatter';
import * as vscode from 'vscode';

export class EditorService {
  constructor() {}

  public async handleEditorChange(document: vscode.TextDocument, text: string): Promise<void> {
    try {
      if (!document || !text) {
        throw new Error('Invalid document or text');
      }

      const edit = new vscode.WorkspaceEdit();
      edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), text);
      const success = await vscode.workspace.applyEdit(edit);

      if (!success) {
        throw new Error('Failed to apply edit');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Failed to update editor content: ${errorMessage}`);
      throw error;
    }
  }

  public async formatDocument(document: vscode.TextDocument): Promise<void> {
    try {
      if (!document) {
        throw new Error('Invalid document');
      }
      await formatDocument(document);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Failed to format document: ${errorMessage}`);
      throw error;
    }
  }
}

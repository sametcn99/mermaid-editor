import * as vscode from 'vscode';

export async function formatDocument(document: vscode.TextDocument): Promise<void> {
  try {
    const text = document.getText();
    const prettier = await import('prettier');
    const formatted = await prettier.format(text, {
      parser: 'markdown',
      printWidth: 80,
      proseWrap: 'preserve',
    });

    await applyFormatting(document, formatted);
    vscode.window.showInformationMessage('Document formatted successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`Failed to format document: ${errorMessage}`);
    await fallbackFormat(document);
  }
}

async function applyFormatting(
  document: vscode.TextDocument,
  formattedText: string
): Promise<void> {
  const edit = new vscode.WorkspaceEdit();
  edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), formattedText);
  await vscode.workspace.applyEdit(edit);
}

async function fallbackFormat(document: vscode.TextDocument): Promise<void> {
  try {
    const text = document.getText();
    const lines = text.split('\n');
    const formattedLines = lines.map(line => line.trim());
    const formatted = formattedLines.join('\n');

    await applyFormatting(document, formatted);
    vscode.window.showInformationMessage('Document formatted with basic formatter');
  } catch (error) {
    vscode.window.showErrorMessage('Failed to apply basic formatting');
  }
}

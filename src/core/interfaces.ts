import * as vscode from 'vscode';

export interface WebviewMessage {
  command: 'editorChange' | 'export' | 'exportComplete' | 'exportError' | 'format';
  text?: string;
  format?: 'png' | 'svg';
  data?: string;
  filePath?: string;
  error?: string;
}

export interface ThemeMessage {
  type: 'vscode-theme-changed';
  theme: 'vscode-dark' | 'vscode-light' | 'vscode-high-contrast';
}

export interface ResourceUris {
  cssUri: string;
  fontAwesomeCssUri: string;
  webfontsUri: string;
  cspSource: string;
  scriptUri: string;
  mermaidUri: string;
  monacoEditorRoot: string;
  monacoEditorUri: string;
  monacoEditorCssUri: string;
}

export interface WebviewServiceResources {
  cssUri: vscode.Uri;
  fontAwesomeCssUri: vscode.Uri;
  webfontsUri: vscode.Uri;
  scriptUri: vscode.Uri;
  mermaidUri: vscode.Uri;
  monacoEditorRoot: vscode.Uri;
}

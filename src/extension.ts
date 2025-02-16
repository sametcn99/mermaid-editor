import * as vscode from "vscode";
import { MermaidEditorExtension } from "./core/MermaidEditorExtension";

export function activate(context: vscode.ExtensionContext) {
  try {
    const extension = new MermaidEditorExtension(context);
    extension.activate();
  } catch (error) {
    console.error("Failed to activate extension:", error);
    vscode.window.showErrorMessage(
      `Failed to activate Mermaid Editor: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export function deactivate() {}

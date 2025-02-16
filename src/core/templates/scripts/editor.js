// Monaco Editor initialization
require.config({
  paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@latest/min/vs" },
});

function initializeEditor() {
  require(["vs/editor/editor.main"], function () {
    const editor = monaco.editor.create(
      document.getElementById("monaco-editor"),
      {
        value: window.mermaidText || "",
        language: "markdown",
        theme: "vs-dark",
        minimap: { enabled: false },
        automaticLayout: true,
        fontSize: 14,
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        wordWrap: "on",
      },
    );

    // Handle editor changes
    editor.onDidChangeModelContent(
      debounce(() => {
        const value = editor.getValue();
        updateDiagram(value);
        window.vscode.postMessage({
          command: "editorChange",
          text: value,
        });
      }, 300),
    );

    // Save current instance
    window.monacoEditor = editor;

    // Monaco editor'a cursor position listener ekleme
    if (editor) {
      editor.onDidChangeCursorPosition((e) => {
        onCursorPositionChange(e.position);
      });
    }
  });
}

function onCursorPositionChange(position) {
  const vscode = acquireVsCodeApi();
  vscode.postMessage({
    type: 'cursorPosition',
    line: position.lineNumber,
    column: position.column
  });
}

document.addEventListener("DOMContentLoaded", initializeEditor);

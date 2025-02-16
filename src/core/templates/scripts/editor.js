// Monaco Editor initialization
require.config({
  paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@latest/min/vs" },
});

function initializeEditor() {
  require(["vs/editor/editor.main"], function () {
    // Get VS Code's current theme colors
    const computedStyle = getComputedStyle(document.body);
    const backgroundColor = computedStyle.getPropertyValue(
      "--vscode-editor-background",
    );
    const foregroundColor = computedStyle.getPropertyValue(
      "--vscode-editor-foreground",
    );

    // Get VS Code's current theme type
    const vsThemeKind = document.body.classList.contains("vscode-dark")
      ? "vs-dark"
      : document.body.classList.contains("vscode-high-contrast")
        ? "hc-black"
        : "vs";

    // Define custom theme with VS Code colors
    monaco.editor.defineTheme("vscode-custom", {
      base: vsThemeKind,
      inherit: true,
      rules: [],
      colors: {
        "editor.background": backgroundColor || null,
        "editor.foreground": foregroundColor || null,
      },
    });

    // Define the editor options with the custom theme
    const editor = monaco.editor.create(
      document.getElementById("monaco-editor"),
      {
        value: window.mermaidText || "",
        language: "markdown",
        theme: "vscode-custom",
        minimap: { enabled: false },
        automaticLayout: true,
        fontSize: 14,
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        wordWrap: "on",
      },
    );

    // Listen for VS Code theme changes
    window.addEventListener("message", (event) => {
      const message = event.data;
      if (message.type === "vscode-theme-changed") {
        // Update theme colors when VS Code theme changes
        const newComputedStyle = getComputedStyle(document.body);
        const newBackgroundColor = newComputedStyle.getPropertyValue(
          "--vscode-editor-background",
        );
        const newForegroundColor = newComputedStyle.getPropertyValue(
          "--vscode-editor-foreground",
        );

        // Update custom theme with new colors
        monaco.editor.defineTheme("vscode-custom", {
          base:
            message.theme === "vscode-dark"
              ? "vs-dark"
              : message.theme === "vscode-high-contrast"
                ? "hc-black"
                : "vs",
          inherit: true,
          rules: [],
          colors: {
            "editor.background": newBackgroundColor || null,
            "editor.foreground": newForegroundColor || null,
          },
        });

        monaco.editor.setTheme("vscode-custom");
      }
    });

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
    type: "cursorPosition",
    line: position.lineNumber,
    column: position.column,
  });
}

document.addEventListener("DOMContentLoaded", initializeEditor);

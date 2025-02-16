function initializeToolbar() {
  // Export handlers
  document
    .getElementById("exportPNG")
    ?.addEventListener("click", () =>
      window.vscode.postMessage({ command: "export", format: "png" }),
    );

  document
    .getElementById("exportSVG")
    ?.addEventListener("click", () =>
      window.vscode.postMessage({ command: "export", format: "svg" }),
    );

  // Copy to clipboard
  document.getElementById("copyToClipboard")?.addEventListener("click", () => {
    const editor = document.getElementById("editor");
    if (editor) {
      navigator.clipboard.writeText(editor.value);
    }
  });

  // Format document
  document
    .getElementById("format")
    ?.addEventListener("click", () =>
      window.vscode.postMessage({ command: "format" }),
    );

  // Zoom controls
  document.getElementById("zoomIn")?.addEventListener("click", () => {
    if (window.zoomDiagram) {
      window.zoomDiagram(0.1);
    }
  });

  document.getElementById("zoomOut")?.addEventListener("click", () => {
    if (window.zoomDiagram) {
      window.zoomDiagram(-0.1);
    }
  });

  document.getElementById("resetZoom")?.addEventListener("click", () => {
    if (window.resetView) {
      window.resetView();
    }
  });

  // Theme selection
  document.getElementById("themeSelect")?.addEventListener("change", (e) => {
    window.vscode.postMessage({
      command: "theme-change",
      theme: e.target.value,
    });
  });
}

document.addEventListener("DOMContentLoaded", initializeToolbar);

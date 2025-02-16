function initializeToolbar() {
  // Export handlers
  document
    .getElementById('exportPNG')
    ?.addEventListener('click', () =>
      window.vscode.postMessage({ command: 'export', format: 'png' })
    );

  document
    .getElementById('exportSVG')
    ?.addEventListener('click', () =>
      window.vscode.postMessage({ command: 'export', format: 'svg' })
    );

  // Format document
  document
    .getElementById('format')
    ?.addEventListener('click', () => window.vscode.postMessage({ command: 'format' }));

  // Zoom controls
  document.getElementById('zoomIn')?.addEventListener('click', () => {
    if (window.zoomDiagram) {
      window.zoomDiagram(0.1);
    }
  });

  document.getElementById('zoomOut')?.addEventListener('click', () => {
    if (window.zoomDiagram) {
      window.zoomDiagram(-0.1);
    }
  });

  document.getElementById('resetZoom')?.addEventListener('click', () => {
    if (window.resetView) {
      window.resetView();
    }
  });
}

document.addEventListener('DOMContentLoaded', initializeToolbar);

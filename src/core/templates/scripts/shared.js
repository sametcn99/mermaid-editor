// Communication with VS Code
const vscode = acquireVsCodeApi();

// Utility functions
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Diagram management
function updateDiagram(text) {
  window.mermaidText = text;
  const previewContent = document.getElementById("preview-content");
  const mermaidDiv = previewContent.querySelector(".mermaid");

  // Store current transform state
  const currentTransform = previewContent.style.transform;

  // Update content
  mermaidDiv.innerHTML = text;

  try {
    mermaid
      .render("mermaid-diagram", text)
      .then(({ svg }) => {
        mermaidDiv.innerHTML = svg;

        // If there's no transform set yet, fit to screen
        if (!currentTransform) {
          setTimeout(() => {
            if (window.fitToScreen) {
              window.fitToScreen();
            }
          }, 50);
        }
      })
      .catch((err) => {
        mermaidDiv.innerHTML = `<div class="error">${err.message}</div>`;
      });
  } catch (err) {
    mermaidDiv.innerHTML = `<div class="error">${err.message}</div>`;
  }
}

function notifyVSCode(command, data) {
  vscode.postMessage({ command, ...data });
}

// Export shared functions
window.updateDiagram = updateDiagram;
window.debounce = debounce;

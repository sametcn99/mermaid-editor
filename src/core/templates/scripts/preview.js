let currentZoom = 1;
let isDragging = false;
let lastX = 0;
let lastY = 0;
let lastTransform = { x: 0, y: 0 };
let cursorHighlight = null;

function initializePreview() {
  const previewContainer = document.querySelector(".preview-container");
  if (!previewContainer) return;

  // Create cursor highlight element
  cursorHighlight = document.createElement("div");
  cursorHighlight.className = "cursor-highlight";
  cursorHighlight.style.position = "absolute";
  cursorHighlight.style.backgroundColor = "rgba(255, 255, 0, 0.3)";
  cursorHighlight.style.pointerEvents = "none";
  cursorHighlight.style.display = "none";
  previewContainer.appendChild(cursorHighlight);

  // Pan events using pointer events
  previewContainer.addEventListener("pointerdown", startPan);
  previewContainer.addEventListener("pointermove", doPan);
  previewContainer.addEventListener("pointerup", endPan);
  previewContainer.addEventListener("pointercancel", endPan);
  previewContainer.addEventListener("pointerleave", endPan);

  // Zoom event
  previewContainer.addEventListener("wheel", handleZoom);

  // Keyboard shortcuts
  document.addEventListener("keydown", handleKeyDown);

  // Listen for cursor position updates from the editor
  window.addEventListener("message", (event) => {
    if (event.data.type === "cursorPosition") {
      highlightPosition(event.data.line, event.data.column);
    }
  });

  // Watch for content changes
  const observer = new MutationObserver(() => {
    const svg = document.querySelector(".mermaid svg");
    if (svg) {
      // Set initial zoom to 100%
      resetView();
    }
  });

  observer.observe(document.getElementById("preview-content"), {
    childList: true,
    subtree: true,
  });

  // Set initial zoom to 100% when content loads
  const previewContent = document.getElementById("preview-content");
  if (previewContent) {
    resetView();
    centerContent();
  }
}

function startPan(e) {
  if (e.button === 0 && (e.getModifierState("Space") || e.altKey)) {
    e.preventDefault();
    e.stopPropagation();

    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;

    const container = e.currentTarget;
    container.style.cursor = "grabbing";
    container.setPointerCapture(e.pointerId);
  }
}

function doPan(e) {
  if (!isDragging) return;

  e.preventDefault();
  e.stopPropagation();

  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;

  lastX = e.clientX;
  lastY = e.clientY;

  const newX = lastTransform.x + dx;
  const newY = lastTransform.y + dy;

  updateTransform(newX, newY);
}

function endPan(e) {
  if (!isDragging) return;

  isDragging = false;
  const container = e.currentTarget;
  container.style.cursor = "default";

  if (e.pointerId) {
    container.releasePointerCapture(e.pointerId);
  }
}

function handleZoom(e) {
  if (!e.ctrlKey) return;

  e.preventDefault();
  e.stopPropagation();

  const delta = e.deltaY > 0 ? -0.1 : 0.1;
  const rect = e.currentTarget.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  zoomAt(mouseX, mouseY, delta);
}

function zoomAt(mouseX, mouseY, delta) {
  const previewContent = document.getElementById("preview-content");
  const oldZoom = currentZoom;
  const newZoom = Math.max(0.1, Math.min(oldZoom + delta, 3));

  if (newZoom !== oldZoom) {
    currentZoom = newZoom;
    const scale = newZoom / oldZoom;

    // Adjust position to zoom at mouse point
    const x = mouseX - (mouseX - lastTransform.x) * scale;
    const y = mouseY - (mouseY - lastTransform.y) * scale;

    updateTransform(x, y);
    updateZoomLevel();
  }
}

function updateTransform(x, y) {
  const previewContent = document.getElementById("preview-content");
  if (!previewContent) return;

  lastTransform.x = x;
  lastTransform.y = y;

  requestAnimationFrame(() => {
    previewContent.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${currentZoom})`;
  });
}

function handleKeyDown(e) {
  if (e.ctrlKey) {
    if (e.key === "0") {
      e.preventDefault();
      resetView();
    } else if (e.key === "f") {
      e.preventDefault();
      fitToScreen();
    }
  }
}

function getTransform(element) {
  const style = window.getComputedStyle(element);
  const matrix = new DOMMatrix(style.transform);
  return {
    x: matrix.e,
    y: matrix.f,
    scale: matrix.a,
  };
}

function resetView() {
  currentZoom = 1; // Always reset to 100%
  lastTransform = { x: 0, y: 0 };

  const previewContent = document.getElementById("preview-content");
  if (previewContent) {
    previewContent.style.transform = `translate(${lastTransform.x}px, ${lastTransform.y}px) scale(${currentZoom})`;
  }

  updateZoomLevel();
}

function fitToScreen() {
  const previewContainer = document.querySelector(".preview-container");
  const mermaidSvg = document.querySelector(".mermaid svg");

  if (!mermaidSvg || !previewContainer) return;

  const containerRect = previewContainer.getBoundingClientRect();
  const contentRect = mermaidSvg.getBoundingClientRect();

  const scaleX =
    (containerRect.width * 0.9) / (contentRect.width / currentZoom);
  const scaleY =
    (containerRect.height * 0.9) / (contentRect.height / currentZoom);
  currentZoom = Math.min(scaleX, scaleY, 3);

  centerContent();
  updateZoomLevel();
}

function centerContent() {
  const previewContainer = document.querySelector(".preview-container");
  const mermaidSvg = document.querySelector(".mermaid svg");
  const previewContent = document.getElementById("preview-content");

  if (!mermaidSvg || !previewContainer || !previewContent) return;

  const containerRect = previewContainer.getBoundingClientRect();
  const contentRect = mermaidSvg.getBoundingClientRect();

  lastTransform = {
    x: (containerRect.width - contentRect.width * currentZoom) / 2,
    y: (containerRect.height - contentRect.height * currentZoom) / 2,
  };

  updateTransform(lastTransform.x, lastTransform.y);
}

function updateZoomLevel() {
  const zoomLevel = document.querySelector(".zoom-level");
  if (zoomLevel) {
    zoomLevel.textContent = `${Math.round(currentZoom * 100)}%`;
  }
}

function highlightPosition(line, column) {
  const previewContent = document.getElementById("preview-content");
  if (!previewContent) return;

  // Önceki highlight'ı temizle
  const oldHighlights = document.querySelectorAll(".cursor-highlight");
  oldHighlights.forEach((h) => h.remove());

  // Yeni highlight elementi oluştur
  const highlight = document.createElement("div");
  highlight.className = "cursor-highlight";

  // Cursor'ın olduğu satırdaki elementi bul
  const elements = previewContent.querySelectorAll(".mermaid [id]");
  let targetElement = null;

  for (const element of elements) {
    if (element.textContent.includes(line.toString())) {
      targetElement = element;
      break;
    }
  }

  if (targetElement) {
    const rect = targetElement.getBoundingClientRect();
    const previewRect = previewContent.getBoundingClientRect();

    highlight.style.left = `${rect.left - previewRect.left}px`;
    highlight.style.top = `${rect.top - previewRect.top}px`;
    highlight.style.width = `${rect.width}px`;
    highlight.style.height = `${rect.height}px`;
    highlight.style.position = "absolute";
    highlight.style.backgroundColor = "rgba(255, 255, 0, 0.2)";
    highlight.style.border = "2px solid rgba(255, 200, 0, 0.5)";
    highlight.style.borderRadius = "3px";
    highlight.style.pointerEvents = "none";
    highlight.style.zIndex = "1000";

    previewContent.appendChild(highlight);

    // Highlight'ı görünür yap ve kademeli olarak sönümlendir
    requestAnimationFrame(() => {
      highlight.style.opacity = "1";
      setTimeout(() => {
        highlight.style.opacity = "0.7";
      }, 500);
    });
  }
}

// Initialize preview when DOM is loaded
document.addEventListener("DOMContentLoaded", initializePreview);

// Export functions for toolbar
window.zoomDiagram = (delta) =>
  zoomAt(window.innerWidth / 4, window.innerHeight / 2, delta);
window.resetView = resetView;
window.fitToScreen = fitToScreen;

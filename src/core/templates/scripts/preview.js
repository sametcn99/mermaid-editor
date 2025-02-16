let currentZoom = 1;
let isDragging = false;
let startX, startY;
let lastTransform = { x: 0, y: 0 };

function initializePreview() {
  setupPreview();
  
  // Watch for content changes and reinitialize if needed
  const observer = new MutationObserver(() => {
    const svg = document.querySelector('.mermaid svg');
    if (svg) {
      setupPreview();
    }
  });
  
  const previewContent = document.getElementById("preview-content");
  observer.observe(previewContent, {
    childList: true,
    subtree: true
  });
}

function setupPreview() {
  const preview = document.getElementById("preview");
  const previewContainer = preview.querySelector(".preview-container");
  const svg = document.querySelector('.mermaid svg');
  
  if (!svg) return;
  
  // Calculate initial position if not set
  if (!lastTransform.x && !lastTransform.y) {
    fitToScreen();
  }
  
  // Zoom handling
  previewContainer.addEventListener("wheel", (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const rect = previewContainer.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      zoomAt(mouseX, mouseY, delta);
    }
  });

  // Pan handling
  previewContainer.addEventListener("mousedown", (e) => {
    if (e.button === 0 && (e.getModifierState("Space") || e.altKey)) {
      e.preventDefault();
      isDragging = true;
      startX = e.clientX - lastTransform.x;
      startY = e.clientY - lastTransform.y;
      previewContainer.style.cursor = "grabbing";
    }
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey) {
      if (e.key === "0") {
        e.preventDefault();
        resetView();
      } else if (e.key === "f") {
        e.preventDefault();
        fitToScreen();
      }
    }
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const x = e.clientX - startX;
    const y = e.clientY - startY;
    updateTransform(x, y);
  });

  document.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      previewContainer.style.cursor = "default";
    }
  });

  // Initialize zoom display
  updateZoomLevel();
}

function zoomAt(mouseX, mouseY, delta) {
  const previewContent = document.getElementById("preview-content");
  const oldZoom = currentZoom;
  const newZoom = Math.max(0.1, Math.min(oldZoom + delta, 3));
  
  if (newZoom !== oldZoom) {
    currentZoom = newZoom;
    
    // Calculate new position to zoom at mouse cursor
    const scale = newZoom / oldZoom;
    const x = mouseX - (mouseX - lastTransform.x) * scale;
    const y = mouseY - (mouseY - lastTransform.y) * scale;
    
    updateTransform(x, y);
    updateZoomLevel();
  }
}

function updateTransform(x, y) {
  const previewContent = document.getElementById("preview-content");
  lastTransform = { x, y };
  previewContent.style.transform = `translate(${x}px, ${y}px) scale(${currentZoom})`;
}

function resetView() {
  currentZoom = 1;
  lastTransform = { x: 0, y: 0 };
  centerContent();
  updateZoomLevel();
}

function fitToScreen() {
  const previewContainer = document.querySelector(".preview-container");
  const previewContent = document.getElementById("preview-content");
  const mermaidSvg = previewContent.querySelector(".mermaid svg");
  
  if (!mermaidSvg) return;
  
  const containerRect = previewContainer.getBoundingClientRect();
  const contentRect = mermaidSvg.getBoundingClientRect();
  
  const scaleX = (containerRect.width * 0.9) / contentRect.width;
  const scaleY = (containerRect.height * 0.9) / contentRect.height;
  currentZoom = Math.min(scaleX, scaleY, 3);
  
  centerContent();
  updateZoomLevel();
}

function centerContent() {
  const previewContainer = document.querySelector(".preview-container");
  const previewContent = document.getElementById("preview-content");
  const mermaidSvg = previewContent.querySelector(".mermaid svg");
  
  if (!mermaidSvg) return;
  
  const containerRect = previewContainer.getBoundingClientRect();
  const contentRect = mermaidSvg.getBoundingClientRect();
  
  lastTransform = {
    x: (containerRect.width - contentRect.width * currentZoom) / 2,
    y: (containerRect.height - contentRect.height * currentZoom) / 2
  };
  
  updateTransform(lastTransform.x, lastTransform.y);
}

function updateZoomLevel() {
  const zoomLevel = document.querySelector(".zoom-level");
  if (zoomLevel) {
    zoomLevel.textContent = `${Math.round(currentZoom * 100)}%`;
  }
}

// Initialize preview when DOM is loaded
document.addEventListener("DOMContentLoaded", initializePreview);

// Export functions for toolbar
window.zoomDiagram = (delta) => zoomAt(window.innerWidth / 4, window.innerHeight / 2, delta);
window.resetView = resetView;
window.fitToScreen = fitToScreen;

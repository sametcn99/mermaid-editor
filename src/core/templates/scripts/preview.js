let currentZoom = 1;
let isDragging = false;
let lastX = 0;
let lastY = 0;
let lastTransform = { x: 0, y: 0 };
let cursorHighlight = null;

function initializePreview() {
  const previewContainer = document.querySelector(".preview-container");
  if (!previewContainer) return;

  // Add style for SVG rendering quality
  const style = document.createElement("style");
  style.textContent = `
    .preview-container {
      backface-visibility: hidden;
      transform-style: preserve-3d;
      will-change: transform;
    }
    .preview-content svg {
      shape-rendering: geometricPrecision;
      text-rendering: optimizeLegibility;
      image-rendering: optimizeQuality;
    }
  `;
  document.head.appendChild(style);

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

  // Adjust delta value for more precise zoom
  const delta = e.deltaY > 0 ? -0.05 : 0.05;
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
    // Add transform-style and backface-visibility to maintain SVG quality
    previewContent.style.transformStyle = "preserve-3d";
    previewContent.style.backfaceVisibility = "hidden";
    previewContent.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${currentZoom})`;

    // Set shape-rendering property to improve SVG render quality
    const svg = previewContent.querySelector("svg");
    if (svg) {
      svg.style.shapeRendering = "geometricPrecision";
      svg.style.textRendering = "optimizeLegibility";
      // Set image-rendering property to prevent SVG pixelation
      svg.style.imageRendering = "optimizeQuality";
    }
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

  try {
    const containerRect = previewContainer.getBoundingClientRect();

    // Get SVG dimensions directly
    const svgWidth = mermaidSvg.getAttribute("width") || mermaidSvg.clientWidth;
    const svgHeight =
      mermaidSvg.getAttribute("height") || mermaidSvg.clientHeight;

    if (!svgWidth || !svgHeight) {
      console.warn("Could not retrieve SVG dimensions");
      return;
    }

    const scaleX = (containerRect.width * 0.9) / (svgWidth / currentZoom);
    const scaleY = (containerRect.height * 0.9) / (svgHeight / currentZoom);
    currentZoom = Math.min(scaleX, scaleY, 3);

    centerContent();
    updateZoomLevel();
  } catch (error) {
    console.error("Fit to screen error:", error);
  }
}

function centerContent() {
  const previewContainer = document.querySelector(".preview-container");
  const mermaidSvg = document.querySelector(".mermaid svg");
  const previewContent = document.getElementById("preview-content");

  if (!mermaidSvg || !previewContainer || !previewContent) return;

  try {
    const containerRect = previewContainer.getBoundingClientRect();

    // Get SVG dimensions directly
    const svgWidth = mermaidSvg.getAttribute("width") || mermaidSvg.clientWidth;
    const svgHeight =
      mermaidSvg.getAttribute("height") || mermaidSvg.clientHeight;

    if (!svgWidth || !svgHeight) {
      console.warn("Could not retrieve SVG dimensions");
      return;
    }

    lastTransform = {
      x: (containerRect.width - svgWidth * currentZoom) / 2,
      y: (containerRect.height - svgHeight * currentZoom) / 2,
    };

    updateTransform(lastTransform.x, lastTransform.y);
  } catch (error) {
    console.error("Center content error:", error);
  }
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

  // Clear previous highlight
  const oldHighlights = document.querySelectorAll(".cursor-highlight");
  oldHighlights.forEach((h) => h.remove());

  // Create new highlight element
  const highlight = document.createElement("div");
  highlight.className = "cursor-highlight";

  // Find the element in the line where the cursor is located
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

    // Make the highlight visible and gradually fade it out
    requestAnimationFrame(() => {
      highlight.style.opacity = "1";
      setTimeout(() => {
        highlight.style.opacity = "0.7";
      }, 500);
    });
  }
}

function ensureValidSVG(svgElement) {
  if (!svgElement) return false;

  // Check SVG dimensions
  let width = svgElement.getAttribute("width");
  let height = svgElement.getAttribute("height");

  // If width/height attributes are missing, get them from viewBox
  if (!width || !height) {
    const viewBox = svgElement.getAttribute("viewBox");
    if (viewBox) {
      const [, , vbWidth, vbHeight] = viewBox.split(" ").map(Number);
      if (!isNaN(vbWidth) && !isNaN(vbHeight)) {
        width = vbWidth;
        height = vbHeight;
        svgElement.setAttribute("width", width);
        svgElement.setAttribute("height", height);
      }
    }
  }

  // If dimensions are still missing, assign default values
  if (!width || !height) {
    width = svgElement.clientWidth || 800;
    height = svgElement.clientHeight || 600;
    svgElement.setAttribute("width", width);
    svgElement.setAttribute("height", height);
  }

  // Update ViewBox
  if (!svgElement.getAttribute("viewBox")) {
    svgElement.setAttribute("viewBox", `0 0 ${width} ${height}`);
  }

  // Set SVG properties
  svgElement.style.display = "block";
  svgElement.style.maxWidth = "none";
  svgElement.style.maxHeight = "none";
  svgElement.style.shapeRendering = "geometricPrecision";
  svgElement.style.textRendering = "optimizeLegibility";
  svgElement.style.imageRendering = "optimizeQuality";
  svgElement.style.transformOrigin = "0 0";

  return true;
}

function updateDiagram(text) {
  if (!text) return;

  window.mermaidText = text;
  const previewContent = document.getElementById("preview-content");
  const mermaidDiv = previewContent.querySelector(".mermaid");

  if (!mermaidDiv) {
    console.error("Mermaid div not found");
    return;
  }

  const currentTransform = previewContent.style.transform;

  try {
    mermaidDiv.innerHTML = text;

    mermaid
      .render("mermaid-diagram", text)
      .then(({ svg }) => {
        try {
          mermaidDiv.innerHTML = svg;

          const svgElement = mermaidDiv.querySelector("svg");
          if (svgElement && ensureValidSVG(svgElement)) {
            // SVG successfully prepared, set screen position
            if (!currentTransform) {
              setTimeout(() => {
                if (window.fitToScreen) {
                  window.fitToScreen();
                }
              }, 100);
            }
          } else {
            throw new Error("Invalid or missing SVG element");
          }
        } catch (renderError) {
          console.error("SVG render error:", renderError);
          mermaidDiv.innerHTML = `<div class="error">Diagram render error: ${renderError.message}</div>`;
        }
      })
      .catch((err) => {
        console.error("Mermaid render error:", err);
        mermaidDiv.innerHTML = `<div class="error">Syntax error: ${err.message}</div>`;
      });
  } catch (err) {
    console.error("General error:", err);
    mermaidDiv.innerHTML = `<div class="error">Unexpected error: ${err.message}</div>`;
  }
}

// Initialize preview when DOM is loaded
document.addEventListener("DOMContentLoaded", initializePreview);

// Export functions for toolbar
window.zoomDiagram = (delta) =>
  zoomAt(window.innerWidth / 4, window.innerHeight / 2, delta);
window.resetView = resetView;
window.fitToScreen = fitToScreen;

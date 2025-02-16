// Language utilities for internationalization
type TranslationKey =
  | "Hide Editor"
  | "Show Editor"
  | "Export as PNG"
  | "Export as SVG"
  | "PNG"
  | "SVG"
  | "Copy to Clipboard"
  | "Copy"
  | "Format Diagram Code"
  | "Format"
  | "Zoom In (Ctrl + Mouse Wheel Up)"
  | "Zoom Out (Ctrl + Mouse Wheel Down)"
  | "Reset Zoom (Ctrl + 0)"
  | "Ctrl + Wheel: Zoom"
  | "Space + Drag: Pan"
  | "Ctrl + 0: Reset View"
  | "Ctrl + F: Fit to Screen"
  | "Mermaid Editor";

type Translations = {
  [lang: string]: {
    [key in TranslationKey]: string;
  };
};

let currentLanguage = "en";

const translations: Translations = {
  en: {
    "Hide Editor": "Hide Editor",
    "Show Editor": "Show Editor",
    "Export as PNG": "Export as PNG",
    "Export as SVG": "Export as SVG",
    PNG: "PNG",
    SVG: "SVG",
    "Copy to Clipboard": "Copy to Clipboard",
    Copy: "Copy",
    "Format Diagram Code": "Format Diagram Code",
    Format: "Format",
    "Zoom In (Ctrl + Mouse Wheel Up)": "Zoom In (Ctrl + Mouse Wheel Up)",
    "Zoom Out (Ctrl + Mouse Wheel Down)": "Zoom Out (Ctrl + Mouse Wheel Down)",
    "Reset Zoom (Ctrl + 0)": "Reset Zoom (Ctrl + 0)",
    "Ctrl + Wheel: Zoom": "Ctrl + Wheel: Zoom",
    "Space + Drag: Pan": "Space + Drag: Pan",
    "Ctrl + 0: Reset View": "Ctrl + 0: Reset View",
    "Ctrl + F: Fit to Screen": "Ctrl + F: Fit to Screen",
    "Mermaid Editor": "Mermaid Editor",
  },
  // Add more languages here
};

export function t(key: TranslationKey, lang: string = currentLanguage): string {
  return translations[lang]?.[key] || key;
}

export function setLanguage(lang: string): void {
  if (translations[lang]) {
    currentLanguage = lang;
  }
}

import { StyleConfig } from "../interfaces/StyleConfig";

export function styleConfigToCss(config: StyleConfig): string {
  const rules = Object.entries(config.rules)
    .map(([key, value]) => {
      // Convert camelCase to kebab-case
      const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
      return `${cssKey}: ${value};`;
    })
    .join("\n  ");

  return `${config.selector} {
  ${rules}
}`;
}

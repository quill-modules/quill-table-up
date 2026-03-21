import { toCamelCase, toKebabCase } from '../transformer';

export function getInlineStyles(domNode: HTMLElement): Record<string, string> {
  const inlineStyles: Record<string, string> = {};
  if (!domNode.style.cssText) {
    return inlineStyles;
  }

  const cssText = domNode.style.cssText;
  const declarations = cssText.split(';').filter(decl => decl.trim());
  for (const declaration of declarations) {
    const colonIndex = declaration.indexOf(':');
    if (colonIndex === -1) continue;

    const property = declaration.slice(0, colonIndex).trim();
    const value = declaration.slice(colonIndex + 1).trim();
    inlineStyles[property] = value;
  }

  return inlineStyles;
}

export function cssTextToObject(cssText: string): Record<string, string> {
  const styleObject: Record<string, string> = {};

  const styles = cssText.trim().split(';');

  for (const item of styles) {
    const style = item.trim();
    if (!style) continue;

    const colonPosition = style.indexOf(':');
    if (colonPosition === -1) continue;

    const property = style.slice(0, Math.max(0, colonPosition)).trim();
    const value = style.slice(Math.max(0, colonPosition + 1)).trim();
    styleObject[toCamelCase(property)] = value;
  }

  return styleObject;
}

export function objectToCssText(obj: Record<string, any>): string {
  return Object.entries(obj)
    .map(([key, value]) => `${toKebabCase(key)}: ${value};`)
    .join(' ');
}

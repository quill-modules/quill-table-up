interface CSSRule {
  selector: string;
  styles: Record<string, string>;
}

export function parseCSSRules(cssText: string): CSSRule[] {
  const rules: CSSRule[] = [];
  // Remove CSS comments
  const cleaned = cssText.replaceAll(/\/\*[\s\S]*?\*\//g, '');
  // Match selector { declarations } blocks
  const ruleRegex = /([^{}]+)\{([^{}]*)\}/g;
  let match;
  while ((match = ruleRegex.exec(cleaned)) !== null) {
    const selector = match[1].trim();
    const declarations = match[2].trim();
    // Skip @-rules
    if (selector.startsWith('@')) continue;
    const styles: Record<string, string> = {};
    for (const decl of declarations.split(';')) {
      const colonIndex = decl.indexOf(':');
      if (colonIndex === -1) continue;
      const prop = decl.slice(0, colonIndex).trim();
      const value = decl.slice(colonIndex + 1).trim();
      if (prop && value) {
        styles[prop] = value;
      }
    }
    if (Object.keys(styles).length > 0) {
      rules.push({ selector, styles });
    }
  }
  return rules;
}

// A selector is tag-only if it contains no class (.), id (#),
// attribute ([), or pseudo (:) indicators — meaning it's composed
// solely of tag names and combinators (space, >, +, ~).
// e.g. "td", "table td", "tr > td", "table > tbody > tr > td"
export function isTagOnlySelector(selector: string): boolean {
  return !/[.#\[:]/.test(selector);
}

export interface ResolveStyleSheetOptions {
  includeDefaultTagStyle?: boolean;
}

export function resolveStyleSheetToInline(doc: Document, options?: ResolveStyleSheetOptions): void {
  const includeDefaultTagStyle = options?.includeDefaultTagStyle ?? false;
  const styleElements = doc.querySelectorAll('style');
  for (const styleEl of Array.from(styleElements)) {
    const rules = parseCSSRules(styleEl.textContent || '');
    for (const rule of rules) {
      // A single selector string may contain comma-separated selectors
      const selectors = rule.selector.split(',').map(s => s.trim()).filter(Boolean);
      for (const selector of selectors) {
        // Skip tag-only selectors (e.g. "td", "table td", "tr > td") unless explicitly allowed
        if (!includeDefaultTagStyle && isTagOnlySelector(selector)) {
          continue;
        }
        let elements: NodeListOf<Element>;
        try {
          elements = doc.querySelectorAll(selector);
        }
        catch {
          // Skip invalid selectors
          continue;
        }
        for (const el of Array.from(elements)) {
          const htmlEl = el as HTMLElement;
          for (const [prop, value] of Object.entries(rule.styles)) {
            // Inline style takes priority — only set if not already present
            if (!htmlEl.style.getPropertyValue(prop)) {
              htmlEl.style.setProperty(prop, value);
            }
          }
        }
      }
    }
  }
}

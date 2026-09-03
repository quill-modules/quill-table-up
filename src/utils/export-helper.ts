/**
 * Export helper: converts table CSS classes to inline styles for WYSIWYG export.
 * Clones table DOM and applies computed styles as inline CSS attributes.
 * Useful for third-party converters (HTML→PDF, etc.) that don't load external stylesheets.
 */

export interface ExportInlineStylesOptions {
  /** CSS properties to inline on table element */
  tableProps?: string[];
  /** CSS properties to inline on row elements (tr) */
  rowProps?: string[];
  /** CSS properties to inline on cell elements (td, th) */
  cellProps?: string[];
  /** CSS properties to inline on column/colgroup elements */
  colProps?: string[];
  /** CSS properties to inline on caption */
  captionProps?: string[];
}

const DEFAULT_TABLE_PROPS = [
  'border-collapse',
  'border-spacing',
  'table-layout',
  'width',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'background-color',
];

const DEFAULT_ROW_PROPS = ['height', 'background-color'];

const DEFAULT_CELL_PROPS = [
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'border-top',
  'border-right',
  'border-bottom',
  'border-left',
  'border-top-style',
  'border-right-style',
  'border-bottom-style',
  'border-left-style',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'border-top-width',
  'border-right-width',
  'border-bottom-width',
  'border-left-width',
  'background-color',
  'height',
  'width',
  'vertical-align',
  'text-align',
];

const DEFAULT_COL_PROPS = ['width', 'background-color'];
const DEFAULT_CAPTION_PROPS = ['caption-side', 'text-align'];

/**
 * Clone a table element and apply computed styles as inline CSS.
 * Preserves all HTML structure and attributes.
 *
 * @param tableElement - The original table DOM element
 * @param options - Configuration for which CSS properties to inline
 * @returns Cloned table element with inline styles
 *
 * @example
 * const table = document.querySelector('table.ql-table');
 * const inlinedClone = getTableWithInlineStyles(table);
 * const html = inlinedClone.outerHTML;
 * // html now contains inline style attributes for all table-related styles
 */
export function getTableWithInlineStyles(
  tableElement: HTMLElement,
  options?: ExportInlineStylesOptions,
): HTMLElement {
  const {
    tableProps = DEFAULT_TABLE_PROPS,
    rowProps = DEFAULT_ROW_PROPS,
    cellProps = DEFAULT_CELL_PROPS,
    colProps = DEFAULT_COL_PROPS,
    captionProps = DEFAULT_CAPTION_PROPS,
  } = options || {};

  const clone = tableElement.cloneNode(true) as HTMLElement;

  // Inline styles on the table itself
  if (clone.tagName.toLowerCase() === 'table') {
    applyComputedStylesToElement(clone, tableElement, tableProps);
  }

  // Inline styles on colgroup and col elements
  const colgroups = clone.querySelectorAll('colgroup');
  const originalColgroups = tableElement.querySelectorAll('colgroup');
  colgroups.forEach((colgroup, index) => {
    if (originalColgroups[index]) {
      applyComputedStylesToElement(
        colgroup as HTMLElement,
        originalColgroups[index] as HTMLElement,
        colProps,
      );
    }
  });

  const cols = clone.querySelectorAll('col');
  const originalCols = tableElement.querySelectorAll('col');
  cols.forEach((col, index) => {
    if (originalCols[index]) {
      applyComputedStylesToElement(col as HTMLElement, originalCols[index] as HTMLElement, colProps);
    }
  });

  // Inline styles on caption
  const captions = clone.querySelectorAll('caption');
  const originalCaptions = tableElement.querySelectorAll('caption');
  captions.forEach((caption, index) => {
    if (originalCaptions[index]) {
      applyComputedStylesToElement(
        caption as HTMLElement,
        originalCaptions[index] as HTMLElement,
        captionProps,
      );
    }
  });

  // Inline styles on thead, tbody, tfoot
  const bodySections = clone.querySelectorAll('thead, tbody, tfoot');
  const originalBodySections = tableElement.querySelectorAll('thead, tbody, tfoot');
  bodySections.forEach((section, index) => {
    if (originalBodySections[index]) {
      applyComputedStylesToElement(
        section as HTMLElement,
        originalBodySections[index] as HTMLElement,
        ['background-color'],
      );
    }
  });

  // Inline styles on rows
  const rows = clone.querySelectorAll('tr');
  const originalRows = tableElement.querySelectorAll('tr');
  rows.forEach((row, index) => {
    if (originalRows[index]) {
      applyComputedStylesToElement(row as HTMLElement, originalRows[index] as HTMLElement, rowProps);
    }
  });

  // Inline styles on cells (td and th)
  const cells = clone.querySelectorAll('td, th');
  const originalCells = tableElement.querySelectorAll('td, th');
  cells.forEach((cell, index) => {
    if (originalCells[index]) {
      applyComputedStylesToElement(
        cell as HTMLElement,
        originalCells[index] as HTMLElement,
        cellProps,
      );
    }
  });

  return clone;
}

/**
 * Get all tables from the editor container and return their HTML with inline styles.
 *
 * @param editorElement - The Quill editor root element
 * @param options - Configuration for which CSS properties to inline
 * @returns Array of HTML strings, one per table
 *
 * @example
 * const quill = new Quill('#editor', { ... });
 * const tableHtmls = getEditorTablesWithInlineStyles(quill.root);
 * tableHtmls.forEach(html => console.log(html));
 */
export function getEditorTablesWithInlineStyles(
  editorElement: HTMLElement,
  options?: ExportInlineStylesOptions,
): string[] {
  const tables = editorElement.querySelectorAll('.ql-table-wrapper table, table.ql-table');
  const results: string[] = [];

  for (const table of Array.from(tables)) {
    const inlined = getTableWithInlineStyles(table as HTMLElement, options);
    results.push(inlined.outerHTML);
  }

  return results;
}

/**
 * Apply computed CSS properties from the original element to the clone as inline styles.
 * Only sets properties that have non-default values.
 *
 * @internal
 */
function applyComputedStylesToElement(
  cloneElement: HTMLElement,
  originalElement: HTMLElement,
  propertiesToCopy: string[],
): void {
  const computed = window.getComputedStyle(originalElement);

  for (const prop of propertiesToCopy) {
    const value = computed.getPropertyValue(prop).trim();

    // Skip default/empty values and already inline styles
    if (!value || value === 'initial' || value === 'inherit' || value === 'auto') {
      continue;
    }

    // Also skip if the value is the browser default for this element/property combo
    // (e.g., 'rgba(0, 0, 0, 0)' for background-color when not explicitly set)
    if (prop === 'background-color' && value === 'rgba(0, 0, 0, 0)') {
      continue;
    }

    // Convert property name to camelCase for style.setProperty
    const styleKey = prop.replace(/-([a-z])/g, (_, char) => char.toUpperCase());

    try {
      cloneElement.style.setProperty(prop, value);
    }
    catch {
      // Skip properties that cause errors (e.g., invalid values, unsupported in this context)
    }
  }
}

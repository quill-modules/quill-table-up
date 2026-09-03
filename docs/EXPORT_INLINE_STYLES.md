# Table Export with Inline Styles (WYSIWYG Export)

## Overview

This feature solves the WYSIWYG (What You See Is What You Get) problem when exporting tables from Quill to third-party tools. The issue: external stylesheets containing `.ql-table-cell { padding: 8px 12px; }` are not loaded by PDF converters or other HTML processors, resulting in unstyled tables.

**Solution**: Convert all computed CSS (from `index.less` and external stylesheets) to inline `style` attributes on table elements, making the table self-contained and renderableeven without external CSS.

---

## Quick Start

```typescript
import Quill from 'quill';
import TableUp from 'quill-table-up';

Quill.register({ 'modules/table-up': TableUp }, true);
const quill = new Quill('#editor', {
  modules: {
    'table-up': { /* ... */ }
  }
});

// Create a table
const tableModule = quill.getModule('table-up');
tableModule.insertTable(3, 3);

// Export with inline styles
const htmlWithInlineStyles = tableModule.exportTableHtmlWithInlineStyles();
console.log(htmlWithInlineStyles); // HTML with inline padding, borders, etc.
```

---

## API

### `TableUp.exportTableHtmlWithInlineStyles(tableId?: string): string | string[]`

Exports table HTML with all computed styles converted to inline CSS attributes.

**Parameters:**
- `tableId` (optional): Export a specific table by its data-table-id. If omitted, exports all tables.

**Returns:**
- `string`: If `tableId` is provided, returns the HTML of that single table.
- `string[]`: If `tableId` is not provided, returns an array of HTML strings (one per table).

**Example:**

```typescript
// Export all tables
const allTables = tableModule.exportTableHtmlWithInlineStyles();
allTables.forEach((html, index) => {
  console.log(`Table ${index}:`, html);
});

// Export a specific table
const specificTable = tableModule.exportTableHtmlWithInlineStyles('table-123');
console.log(specificTable);
```

### Utility: `getTableWithInlineStyles(tableElement: HTMLElement, options?: ExportInlineStylesOptions): HTMLElement`

Low-level function to clone a table element and apply inline styles. Useful if you need more control.

```typescript
import { getTableWithInlineStyles } from 'quill-table-up';

const tableElement = document.querySelector('table.ql-table');
const clonedWithStyles = getTableWithInlineStyles(tableElement);
console.log(clonedWithStyles.outerHTML);
```

**Options:**

```typescript
interface ExportInlineStylesOptions {
  tableProps?: string[];   // CSS properties for <table>
  rowProps?: string[];     // CSS properties for <tr>
  cellProps?: string[];    // CSS properties for <td>/<th>
  colProps?: string[];     // CSS properties for <col>/<colgroup>
  captionProps?: string[]; // CSS properties for <caption>
}

// Example: customize what properties to inline
const html = getTableWithInlineStyles(table, {
  cellProps: ['padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'border'],
});
```

---

## What Gets Inlined

By default, the exporter inlines these properties:

### Table
- `border-collapse`, `border-spacing`, `table-layout`
- `width`, `margin-*`
- `background-color`

### Rows (`<tr>`)
- `height`, `background-color`

### Cells (`<td>`, `<th>`)
- `padding-*`
- `border-*` (all: top, right, bottom, left, and variants like border-width, border-color)
- `background-color`
- `height`, `width`, `vertical-align`, `text-align`

### Columns (`<col>`, `<colgroup>`)
- `width`, `background-color`

### Caption
- `caption-side`, `text-align`

---

## Use Cases

### 1. Export for PDF Conversion (e.g., wkhtmltopdf, Puppeteer)

```typescript
// User clicks "Export to PDF"
const tableHtml = tableModule.exportTableHtmlWithInlineStyles();
const pdfHtml = `
  <!DOCTYPE html>
  <html>
    <head>
      <style>
        body { font-family: Arial; }
        table { margin: 20px; }
      </style>
    </head>
    <body>
      ${tableHtml[0]}
    </body>
  </html>
`;

// Send to Puppeteer or wkhtmltopdf
await pdfConverter.convert(pdfHtml);
```

### 2. Send to Third-Party Service

```typescript
const html = tableModule.exportTableHtmlWithInlineStyles('my-table-id');

// Send to an external API (e.g., Cloud Convert, Zamzar)
fetch('https://api.example.com/convert', {
  method: 'POST',
  body: JSON.stringify({ html, format: 'pdf' }),
});
```

### 3. Paste into Email or Document

```typescript
const html = tableModule.exportTableHtmlWithInlineStyles();
const emailBody = `
  <p>Dear Recipient,</p>
  <p>Please see the table below:</p>
  ${html[0]}
  <p>Best regards</p>
`;

// Send as HTML email
sendEmail(emailBody);
```

---

## Output Example

**Before (without inline styles):**
```html
<table class="ql-table" data-table-id="abc123">
  <tr class="ql-table-row">
    <td class="ql-table-cell">Cell 1</td>
    <td class="ql-table-cell">Cell 2</td>
  </tr>
</table>
```
(Relies on external `.ql-table-cell { padding: 8px 12px; }`)

**After (with inline styles):**
```html
<table style="border-collapse: collapse; border-spacing: 0; table-layout: fixed; width: 300px; margin-right: auto;">
  <tr style="height: auto;">
    <td style="padding: 8px 12px; border: 1px solid #a1a1aa; background-color: rgba(0,0,0,0);">Cell 1</td>
    <td style="padding: 8px 12px; border: 1px solid #a1a1aa; background-color: rgba(0,0,0,0);">Cell 2</td>
  </tr>
</table>
```
(Fully self-contained, works in any context)

---

## Performance Considerations

- **Runtime cost**: Minimal. The function clones the table DOM and reads `getComputedStyle()` once per element.
- **Memory**: A temporary clone is created in memory; the original table is unchanged.
- **Best practice**: Call this function only when exporting, not on every keystroke.

---

## Limitations & Notes

1. **Inline styles take priority**: If a cell already has an inline `style` attribute, computed styles won't override it (by design).
2. **Browser context required**: Must run in a browser environment where `getComputedStyle()` can read styles from the CSS OM.
3. **No external stylesheets**: Works best when Quill and quill-table-up stylesheets are loaded. If using a custom theme, make sure it's applied before exporting.
4. **Z-index & animations**: Complex CSS like `z-index`, `animation`, `@media` queries are not inlined (as they shouldn't be).

---

## Migration from Class-Based to Inline Styles

If your external tool was previously ignoring `.ql-table-cell` styles, simply:

1. **Old approach**: Rely on user to include quill-table-up CSS
   ```html
   <!-- User must load this for styles to work -->
   <link rel="stylesheet" href="node_modules/quill-table-up/dist/index.css">
   ```

2. **New approach**: Use inline styles directly
   ```typescript
   const html = tableModule.exportTableHtmlWithInlineStyles();
   // No external CSS needed!
   ```

---

## Testing

See [export-helper.test.ts](./export-helper.test.ts) for comprehensive examples:
- Inlining padding from `.ql-table-cell`
- Preserving user-applied inline styles
- Exporting multiple tables
- Exporting by table ID

```bash
pnpm run test:unit -- export-helper.test.ts
```

---

## Related Reading

- [Problem Statement (WYSIWYG Issue)](#overview)
- [Quill Themes & CSS](https://quilljs.com/docs/themes/)
- [Inline Styles vs. CSS Classes](https://developer.mozilla.org/en-US/docs/Web/CSS/Cascade)

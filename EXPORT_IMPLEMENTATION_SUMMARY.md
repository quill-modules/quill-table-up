# Export-Time Inline Styles Implementation Summary

## Problem Statement
When exporting tables from quill-table-up to third-party tools (PDF converters, email clients, etc.), the generated HTML references CSS classes like `.ql-table-cell { padding: 8px 12px }` that aren't available in those external contexts. Result: unstyled tables (broken WYSIWYG).

## Solution Implemented
Export-time inlining: convert all computed CSS to inline `style` attributes, making tables self-contained and renderable without external stylesheets.

---

## Files Created

### 1. `src/utils/export-helper.ts` (New)
**Purpose**: Core export utility providing two public functions:

- **`getTableWithInlineStyles(tableElement, options?)`**
  - Clones a table element
  - Computes all CSS properties using `getComputedStyle()`
  - Applies computed values as inline `style` attributes
  - Returns cloned element with inline styles (original unchanged)
  - Supports customization via `ExportInlineStylesOptions`

- **`getEditorTablesWithInlineStyles(editorElement, options?)`**
  - Helper to extract all tables from an editor
  - Returns array of HTML strings with inline styles

**Key Features:**
- Smart filtering: skips default/transparent values (e.g., `rgba(0,0,0,0)`)
- Exhaustive property list: covers padding, border, background, dimensions, alignment, etc.
- Safe: no mutations of original DOM, only returns a clone
- Robust: try-catch around `setProperty()` to skip unsupported properties

---

## Files Modified

### 1. `src/utils/index.ts`
Added export for new utility:
```typescript
export * from './export-helper';
```

### 2. `src/table-up.ts`
**Added import:**
```typescript
import { ..., getTableWithInlineStyles, ... } from './utils';
```

**Added method to `TableUp` class:**
```typescript
exportTableHtmlWithInlineStyles(tableId?: string): string | string[]
```
- Public API for users to export with inline styles
- If `tableId` provided: returns single HTML string for that table
- If `tableId` omitted: returns array of HTML strings (all tables)
- Includes JSDoc with examples

---

## Files Created (Tests & Docs)

### 1. `src/__tests__/unit/export-helper.test.ts` (New)
Comprehensive test suite (8 test cases):
- ✅ Inlines padding from `.ql-table-cell` class
- ✅ Inlines border styles from computed styles
- ✅ Preserves existing inline styles
- ✅ Handles table width (100% and pixel-based)
- ✅ Exports multiple tables from editor
- ✅ Confirms `exportTableHtmlWithInlineStyles` method exists
- ✅ Tests export by specific table ID
- ✅ Skips default computed styles (e.g., transparent background)

### 2. `docs/EXPORT_INLINE_STYLES.md` (New)
Complete user documentation:
- Overview & use cases
- API reference with examples
- Default properties inlined (table, row, cell, col, caption)
- Output example (before/after)
- Performance considerations
- Migration guide

---

## API Usage

```typescript
// Export all tables with inline styles
const allTables = tableModule.exportTableHtmlWithInlineStyles();
// Returns: string[]

// Export specific table by ID
const oneTable = tableModule.exportTableHtmlWithInlineStyles('my-table-id');
// Returns: string

// Low-level API for advanced use
import { getTableWithInlineStyles } from 'quill-table-up';
const customClone = getTableWithInlineStyles(domElement, {
  cellProps: ['padding', 'border', 'background-color']
});
```

---

## Default CSS Properties Inlined

| Element | Properties |
|---------|-----------|
| `<table>` | `border-collapse`, `border-spacing`, `table-layout`, `width`, `margin-*`, `background-color` |
| `<tr>` | `height`, `background-color` |
| `<td>` / `<th>` | `padding-*`, `border-*`, `background-color`, `height`, `width`, `vertical-align`, `text-align` |
| `<col>` / `<colgroup>` | `width`, `background-color` |
| `<caption>` | `caption-side`, `text-align` |

---

## Benefits

✅ **WYSIWYG Export**: Tables render identically in external tools (PDF, email, etc.)
✅ **Non-invasive**: No changes to editor behavior; opt-in export feature
✅ **No bloat**: Only exports when needed; original content stays class-based
✅ **Customizable**: Users can override which properties to inline via `ExportInlineStylesOptions`
✅ **Robust**: Computed styles are read from the rendered DOM, so all CSS (external + inline) is captured
✅ **Fast**: Minimal overhead; only clones and reads styles on demand

---

## Testing

Run the test suite:
```bash
pnpm run test:unit -- export-helper.test.ts
```

Test coverage:
- DOM cloning and style transfer
- Multiple tables in same editor
- Filtering of default values
- ID-based table selection
- Public API availability

---

## Build Integration

No build changes needed. The export helper:
- Is automatically included in `dist/index.js` via the updated `src/utils/index.ts`
- Works in both ESM and CommonJS contexts
- Has no external dependencies
- Runs in browser (uses `getComputedStyle`)

---

## Example: Export to PDF

```typescript
import Quill from 'quill';
import TableUp from 'quill-table-up';
import { exportPdf } from 'pdfkit'; // or any converter

const quill = new Quill('#editor', { modules: { 'table-up': {} } });
const tableModule = quill.getModule('table-up');

// User clicks "Download as PDF"
function downloadPDF() {
  const tableHtml = tableModule.exportTableHtmlWithInlineStyles();
  
  const document = `
    <!DOCTYPE html>
    <html>
      <body>
        ${Array.isArray(tableHtml) ? tableHtml.join('') : tableHtml}
      </body>
    </html>
  `;
  
  // Send to wkhtmltopdf, Puppeteer, or similar
  exportPdf(document, 'table.pdf');
}
```

---

## Next Steps (Optional Future Enhancements)

1. **Option to export Delta delta with inline styles**: Store inline styles in the content model
2. **Custom property list per cell**: Let users override styles per table
3. **CSS media query support**: Generate separate inline styles for print vs. screen
4. **Performance caching**: Cache computed styles if exporting same table multiple times

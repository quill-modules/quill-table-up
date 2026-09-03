import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getTableWithInlineStyles, getEditorTablesWithInlineStyles } from '../../utils/export-helper';
import { createQuillWithTableModule } from './utils';
import { TableUp } from '../../table-up';

describe('export-helper: inline styles export', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    // Clean up DOM
    const containers = document.body.querySelectorAll('div');
    containers.forEach((container) => {
      if (container.parentNode === document.body) {
        container.remove();
      }
    });
  });

  it('should inline padding styles from .ql-table-cell class to td elements', async () => {
    const quill = createQuillWithTableModule('<p><br></p>', { full: false });
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;

    tableModule.insertTable(2, 2);
    await vi.runAllTimersAsync();

    const table = quill.root.querySelector('table.ql-table') as HTMLElement;
    expect(table).toBeTruthy();

    const inlined = getTableWithInlineStyles(table);
    const cells = inlined.querySelectorAll('td');

    expect(cells.length).toBeGreaterThan(0);

    const hasPadding = Array.from(cells).some((cell) => {
      const style = cell.getAttribute('style') || '';
      return style.includes('padding');
    });

    expect(hasPadding).toBe(true);
  });

  it('should inline border styles from computed styles', async () => {
    const quill = createQuillWithTableModule('<p><br></p>', { full: false });
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;

    tableModule.insertTable(2, 2);
    await vi.runAllTimersAsync();

    const table = quill.root.querySelector('table.ql-table') as HTMLElement;
    const inlined = getTableWithInlineStyles(table);
    const cells = inlined.querySelectorAll('td');

    const hasBorder = Array.from(cells).some((cell) => {
      const style = cell.getAttribute('style') || '';
      return style.includes('border');
    });

    expect(hasBorder).toBe(true);
  });

  it('should preserve existing inline styles while adding computed styles', async () => {
    const quill = createQuillWithTableModule('<p><br></p>', { full: false });
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;

    tableModule.insertTable(2, 2);
    await vi.runAllTimersAsync();

    const table = quill.root.querySelector('table.ql-table') as HTMLElement;
    const firstCell = table.querySelector('td') as HTMLElement;

    if (firstCell) {
      firstCell.style.backgroundColor = 'rgb(255, 0, 0)';
    }

    const inlined = getTableWithInlineStyles(table);
    const inlinedFirstCell = inlined.querySelector('td') as HTMLElement;

    expect(inlinedFirstCell?.getAttribute('style')).toContain('background-color');
  });

  it('should handle table width (100% or pixel-based)', async () => {
    const quill = createQuillWithTableModule('<p><br></p>', { full: true });
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;

    tableModule.insertTable(2, 2);
    await vi.runAllTimersAsync();

    const table = quill.root.querySelector('table.ql-table') as HTMLElement;
    const inlined = getTableWithInlineStyles(table);

    const style = inlined.getAttribute('style') || '';
    expect(style).toContain('width');
  });

  it('should export multiple tables from editor', async () => {
    const quill = createQuillWithTableModule('<p><br></p>', { full: false });
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;

    tableModule.insertTable(2, 2);
    await vi.runAllTimersAsync();
    quill.setSelection(quill.getLength());

    quill.insertText(quill.getLength(), '\n');
    await vi.runAllTimersAsync();

    tableModule.insertTable(3, 3);
    await vi.runAllTimersAsync();

    const htmls = getEditorTablesWithInlineStyles(quill.root);

    expect(htmls.length).toBe(2);
    expect(htmls[0]).toContain('<table');
    expect(htmls[1]).toContain('<table');

    htmls.forEach((html) => {
      expect(html).toContain('style');
      expect(html).toContain('padding');
    });
  });

  it('exportTableHtmlWithInlineStyles method should be available on tableModule', () => {
    const quill = createQuillWithTableModule('<p><br></p>', { full: false });
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;

    expect(tableModule.exportTableHtmlWithInlineStyles).toBeDefined();
    expect(typeof tableModule.exportTableHtmlWithInlineStyles).toBe('function');
  });

  it('should handle export of specific table by ID', async () => {
    const quill = createQuillWithTableModule('<p><br></p>', { full: false });
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;

    tableModule.insertTable(2, 2);
    await vi.runAllTimersAsync();

    const table = quill.root.querySelector('table.ql-table') as HTMLElement;
    const tableId = table?.dataset.tableId;

    const result = tableModule.exportTableHtmlWithInlineStyles(tableId || '');

    expect(typeof result).toBe('string');
    expect(result).toContain('<table');
    expect(result).toContain('style');
  });

  it('should skip default computed styles (e.g., rgba(0,0,0,0))', async () => {
    const quill = createQuillWithTableModule('<p><br></p>', { full: false });
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;

    tableModule.insertTable(1, 1);
    await vi.runAllTimersAsync();

    const table = quill.root.querySelector('table.ql-table') as HTMLElement;
    const inlined = getTableWithInlineStyles(table);

    const cellStyle = inlined.querySelector('td')?.getAttribute('style') || '';

    expect(cellStyle).not.toContain('rgba(0, 0, 0, 0)');
  });

  it('should return array when no tableId is provided', async () => {
    const quill = createQuillWithTableModule('<p><br></p>', { full: false });
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;

    tableModule.insertTable(2, 2);
    await vi.runAllTimersAsync();

    const result = tableModule.exportTableHtmlWithInlineStyles();

    expect(Array.isArray(result)).toBe(true);
    expect((result as string[]).length).toBeGreaterThan(0);
  });
});

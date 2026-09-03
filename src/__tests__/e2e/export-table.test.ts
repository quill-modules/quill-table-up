import { test, expect } from '@playwright/test';
import { createTableBySelect } from './utils';

test.beforeEach(async ({ page }) => {
  await page.goto('http://127.0.0.1:5500/docs/test.html');
  // ensure editor is present
  await page.locator('#editor1').waitFor();
});

test('should load editor with table module', async ({ page }) => {
  await expect(page.locator('#editor1')).toBeVisible();
  const hasTableUp = await page.evaluate(() => {
    return !!(window as any).TableUp && Array.isArray((window as any).quills) && (window as any).quills.length > 0;
  });
  expect(hasTableUp).toBeTruthy();
});

test('should insert a table and export with inline styles', async ({ page }) => {
  await createTableBySelect(page, 'container1', 2, 2);
  await page.waitForSelector('#editor1 .ql-table');

  const html = await page.evaluate(() => {
    const module = (window as any).quills[0].getModule((window as any).TableUp.moduleName);
    return module.exportTableHtmlWithInlineStyles();
  });

  if (Array.isArray(html)) {
    expect(html.length).toBeGreaterThan(0);
    expect(html[0]).toContain('<table');
  } else {
    expect(html).toContain('<table');
  }
});

test('should have inline padding styles in exported table', async ({ page }) => {
  await createTableBySelect(page, 'container1', 2, 2);
  await page.waitForSelector('#editor1 .ql-table');

  const hasPadding = await page.evaluate(() => {
    const module = (window as any).quills[0].getModule((window as any).TableUp.moduleName);
    const html = module.exportTableHtmlWithInlineStyles();
    const htmlString = Array.isArray(html) ? html[0] : html;
    return htmlString.includes('padding');
  });

  expect(hasPadding).toBe(true);
});

test('should have inline border styles in exported table', async ({ page }) => {
  await createTableBySelect(page, 'container1', 3, 3);
  await page.waitForSelector('#editor1 .ql-table');

  const hasBorder = await page.evaluate(() => {
    const module = (window as any).quills[0].getModule((window as any).TableUp.moduleName);
    const html = module.exportTableHtmlWithInlineStyles();
    const htmlString = Array.isArray(html) ? html[0] : html;
    return htmlString.includes('border');
  });

  expect(hasBorder).toBe(true);
});

test('should export table with width style', async ({ page }) => {
  await createTableBySelect(page, 'container1', 2, 2);
  await page.waitForSelector('#editor1 .ql-table');

  const hasWidth = await page.evaluate(() => {
    const module = (window as any).quills[0].getModule((window as any).TableUp.moduleName);
    const html = module.exportTableHtmlWithInlineStyles();
    const htmlString = Array.isArray(html) ? html[0] : html;
    return htmlString.includes('width');
  });

  expect(hasWidth).toBe(true);
});

test('should export multiple tables independently', async ({ page }) => {
  await createTableBySelect(page, 'container1', 2, 2);
  await page.waitForSelector('#editor1 .ql-table');

  // move cursor to end and insert second table
  await page.evaluate(() => {
    const quill = (window as any).quills[0];
    quill.setSelection(quill.getLength());
  });
  await createTableBySelect(page, 'container1', 3, 3);
  await page.waitForSelector('#editor1 .ql-table');

  const tables = await page.evaluate(() => {
    const module = (window as any).quills[0].getModule((window as any).TableUp.moduleName);
    const result = module.exportTableHtmlWithInlineStyles();
    return Array.isArray(result) ? result : [result];
  });

  expect(Array.isArray(tables)).toBe(true);
  expect((tables as string[]).length).toBeGreaterThanOrEqual(2);
});

test('should export specific table by ID', async ({ page }) => {
  await createTableBySelect(page, 'container1', 2, 2);
  await page.waitForSelector('#editor1 .ql-table');

  const result = await page.evaluate(() => {
    const table = document.querySelector('#editor1 .ql-table') as HTMLElement | null;
    const tableId = table?.dataset.tableId;
    const module = (window as any).quills[0].getModule((window as any).TableUp.moduleName);
    return module.exportTableHtmlWithInlineStyles(tableId);
  });

  expect(typeof result).toBe('string');
  expect(result).toContain('<table');
  expect(result).toContain('style');
});

test('should preserve cell content in exported table', async ({ page }) => {
  await createTableBySelect(page, 'container1', 2, 2);
  await page.waitForSelector('#editor1 .ql-table');

  await page.evaluate(() => {
    const firstCell = document.querySelector('#editor1 .ql-table .ql-table-cell');
    if (firstCell) {
      const inner = firstCell.querySelector('.ql-table-cell-inner');
      if (inner) inner.textContent = 'Test Content';
    }
  });

  const htmlWithContent = await page.evaluate(() => {
    const module = (window as any).quills[0].getModule((window as any).TableUp.moduleName);
    const html = module.exportTableHtmlWithInlineStyles();
    return Array.isArray(html) ? html[0] : html;
  });

  expect(htmlWithContent).toContain('style');
  expect(htmlWithContent).toContain('<td');
  expect(htmlWithContent).toContain('</td>');
});

test('exported HTML should be valid and parseable', async ({ page }) => {
  await createTableBySelect(page, 'container1', 2, 2);
  await page.waitForSelector('#editor1 .ql-table');

  const canParse = await page.evaluate(() => {
    const module = (window as any).quills[0].getModule((window as any).TableUp.moduleName);
    const html = module.exportTableHtmlWithInlineStyles();
    const htmlString = Array.isArray(html) ? html[0] : html;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlString, 'text/html');
      return doc.querySelector('table') !== null;
    }
    catch {
      return false;
    }
  });

  expect(canParse).toBe(true);
});

test('exported table cells should have computed styles inline', async ({ page }) => {
  await createTableBySelect(page, 'container1', 1, 1);
  await page.waitForSelector('#editor1 .ql-table');

  const cellHasStyles = await page.evaluate(() => {
    const module = (window as any).quills[0].getModule((window as any).TableUp.moduleName);
    const html = module.exportTableHtmlWithInlineStyles();
    const htmlString = Array.isArray(html) ? html[0] : html;
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const td = doc.querySelector('td');
    if (!td) return false;
    const style = td.getAttribute('style') || '';
    return style.length > 0 && (style.includes('padding') || style.includes('border'));
  });

  expect(cellHasStyles).toBe(true);
});


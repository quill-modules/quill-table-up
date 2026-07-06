import { expect } from '@playwright/test';
import { extendTest as test } from './utils';

test.beforeEach(async ({ page }) => {
  await page.goto('http://127.0.0.1:5500/docs/test.html');
  page.locator('.ql-container.ql-snow');
});

test('clean handler should not clean insert text format', async ({ page, editorPage }) => {
  editorPage.index = 0;
  await editorPage.setContents([
    { insert: '\n' },
    { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
    { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
    { insert: '12345', attributes: { bold: true } },
    { attributes: { 'list': 'bullet', 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { insert: '12345', attributes: { bold: true } },
    { attributes: { 'list': 'bullet', 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { insert: '22345', attributes: { bold: true } },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { insert: '3' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { insert: '4' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { insert: '\n' },
  ]);
  await editorPage.setSelection(8, 0);

  await page.locator('#container1 .ql-toolbar .ql-clean').click();
  await editorPage.focus();
  await page.keyboard.type('text');

  const delta = await editorPage.getContents();
  const contents = [
    { insert: '\n' },
    { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
    { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
    { insert: '12345', attributes: { bold: true } },
    { insert: 'text' },
    { attributes: { 'list': 'bullet', 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
    { insert: '12345', attributes: { bold: true } },
    { attributes: { 'list': 'bullet', 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
    { insert: '22345', attributes: { bold: true } },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
    { insert: '3' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
    { insert: '4' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
    { insert: '\n' },
  ];
  for (const [i, op] of delta.ops.entries()) {
    expect(op).toStrictEqual(contents[i]);
  }
});

test('clean handler should not keep table format when have two empty line after block format(like header)', async ({ page, editorPage }) => {
  editorPage.index = 0;
  await editorPage.setContents([
    { insert: '\n' },
    { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
    { insert: 'header' },
    { attributes: { 'header': 1, 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n\n' },
    { insert: '\n' },
  ]);

  await editorPage.setSelection(0, 11);
  await page.locator('#container1 .ql-toolbar .ql-clean').click();
  const delta = await editorPage.getContents();
  const contents = [{ insert: '\nheader\n\n\n\n' }];
  for (const [i, op] of delta.ops.entries()) {
    expect(op).toStrictEqual(contents[i]);
  }
  expect(await editorPage.getSelection()).toEqual({ index: 0, length: 10 });
});

test('toolbar item handler should trigger source USER', async ({ page, editorPage }) => {
  editorPage.index = 0;
  await editorPage.setContents([
    { insert: '\n' },
    { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
    { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
    { insert: '1' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { insert: '2' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { insert: '3' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { insert: '4' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { insert: '\n' },
  ]);

  const textChangePromise = page.evaluate(() => {
    return new Promise<string>((resolve) => {
      window.quills[0].on('text-change', (delta, oldDelta, source) => {
        if (source === 'user') {
          resolve(source);
        }
      });
    });
  });

  await editorPage.setSelection(3, 1);
  await page.locator('#container1 .ql-toolbar .ql-bold').click();
  const result = await textChangePromise;
  expect(result).toBe('user');
});

test('getSemanticHTML should not effect editable when manual copy or cut', async ({ page, editorPage }) => {
  editorPage.index = 0;
  await editorPage.setContents([
    { insert: '\nTable Caption' },
    { attributes: { 'table-up-caption': { tableId: '1', side: 'top' } }, insert: '\n' },
    { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
    { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
    { insert: '1' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { insert: '2' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { insert: '3' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { insert: '4' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { insert: '\n' },
  ]);
  const tableCaption = page.locator('#container1 .ql-table .ql-table-caption');
  const td = page.locator('#container1 .ql-table td .ql-table-cell-inner').nth(0);
  await expect(tableCaption).toHaveAttribute('contenteditable', 'true');
  await expect(td).toHaveAttribute('contenteditable', 'true');

  await editorPage.setSelection(2, 4);
  await page.keyboard.press('Control+C');
  await expect(tableCaption).toHaveAttribute('contenteditable', 'true');
  await expect(tableCaption).toContainText('Table Caption');

  await editorPage.setSelection(2, 4);
  await page.keyboard.press('Control+X');
  await expect(tableCaption).toHaveAttribute('contenteditable', 'true');
  await expect(tableCaption).toContainText('T Caption');

  await editorPage.setSelection(14, 1);
  await page.keyboard.press('Control+C');
  await expect(td).toHaveAttribute('contenteditable', 'true');
  await expect(td).toContainText('1');

  await editorPage.setSelection(14, 1);
  await page.keyboard.press('Control+X');
  await expect(td).toHaveAttribute('contenteditable', 'true');
  await expect(td).toContainText('');
});

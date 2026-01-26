import { expect, test } from '@playwright/test';
import { createTableBySelect, extendTest } from './utils';

test.beforeEach(async ({ page }) => {
  await page.goto('http://127.0.0.1:5500/docs/test.html');
  page.locator('.ql-container.ql-snow');
});

extendTest('test table full width switch redo and undo', async ({ page, editorPage }) => {
  editorPage.index = 0;
  await editorPage.setContents([
    { insert: '\n' },
    { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
    { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
    { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 100 } } },
    { insert: { 'table-up-col': { tableId: '1', colId: '4', full: false, width: 100 } } },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '4', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '4', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '4', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { insert: '\n' },
  ]);
  await page.waitForTimeout(1000);

  const cell = page.locator('#editor1 .ql-editor .ql-table td').nth(0);
  await cell.click();
  await cell.click({ button: 'right' });
  await page.locator('.table-up-menu.is-contextmenu .table-up-menu__item').filter({ hasText: 'Switch table width' }).first().click();
  expect(await page.locator('#editor1 .ql-editor .ql-table[data-full="true"]').count()).toBe(1);
  expect(await page.locator('#editor1 .ql-editor .ql-table colgroup[data-full="true"]').count()).toBe(1);
  expect(await page.locator('#editor1 .ql-editor .ql-table col[data-full="true"]').count()).toBe(4);
  await page.waitForTimeout(1000);

  await page.keyboard.press('Control+z');
  expect(await page.locator('#editor1 .ql-editor .ql-table[data-full="true"]').count()).toBe(0);
  expect(await page.locator('#editor1 .ql-editor .ql-table colgroup[data-full="true"]').count()).toBe(0);
  expect(await page.locator('#editor1 .ql-editor .ql-table col[width="100px"]').count()).toBe(4);
  await page.waitForTimeout(1000);

  await page.keyboard.press('Control+Shift+z');
  expect(await page.locator('#editor1 .ql-editor .ql-table[data-full="true"]').count()).toBe(1);
  expect(await page.locator('#editor1 .ql-editor .ql-table colgroup[data-full="true"]').count()).toBe(1);
  expect(await page.locator('#editor1 .ql-editor .ql-table col[data-full="true"]').count()).toBe(4);
});

extendTest.describe('test table tools should hide after table removed', () => {
  extendTest('about TableResizeLine TableMenuContextmenu', async ({ page, editorPage }) => {
    editorPage.index = 0;
    await createTableBySelect(page, 'container1', 3, 3);
    await page.locator('#container1 .ql-editor .ql-table td').nth(0).click();
    await page.locator('#container1 .ql-editor .ql-table td').nth(0).click({ button: 'right' });
    await page.waitForTimeout(1000);
    await expect(page.locator('#container1 .table-up-toolbox .table-up-selection')).toBeVisible();
    await expect(page.locator('#container1 .table-up-toolbox .table-up-align')).toBeAttached();
    await expect(page.locator('#container1 .table-up-menu')).toBeAttached();
    await expect(page.locator('#container1 .table-up-toolbox .table-up-scrollbar__container')).toBeAttached();
    await expect(page.locator('#container1 .table-up-toolbox .table-up-resize-line__col')).toBeAttached();
    await expect(page.locator('#container1 .table-up-toolbox .table-up-resize-line__row')).toBeAttached();
    await expect(page.locator('#container1 .table-up-toolbox .table-up-scale')).toBeAttached();
    await editorPage.setContents([{ insert: 'replace' }]);
    await page.waitForTimeout(1000);
    await expect(page.locator('#container1 .table-up-toolbox .table-up-selection')).not.toBeVisible();
    await expect(page.locator('#container1 .table-up-toolbox .table-up-align')).not.toBeVisible();
    await expect(page.locator('#container1 .table-up-menu')).not.toBeVisible();
    await expect(page.locator('#container1 .table-up-toolbox .table-up-scrollbar__container')).not.toBeVisible();
    await expect(page.locator('#container1 .table-up-toolbox .table-up-scrollbar__container .table-up-scrollbar.is-vertical')).not.toBeAttached();
    await expect(page.locator('#container1 .table-up-toolbox .table-up-scrollbar__container .table-up-scrollbar.is-horizontal')).not.toBeAttached();
    await expect(page.locator('#container1 .table-up-toolbox .table-up-resize-line__col')).not.toBeVisible();
    await expect(page.locator('#container1 .table-up-toolbox .table-up-resize-line__row')).not.toBeVisible();
    await expect(page.locator('#container1 .table-up-toolbox .table-up-scale')).not.toBeVisible();
  });

  extendTest('about TableResizeBox TableMenuSelect', async ({ page, editorPage }) => {
    editorPage.index = 1;
    await createTableBySelect(page, 'container2', 3, 3);
    await page.locator('#container2 .ql-editor .ql-table td').nth(0).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('#container2 .table-up-toolbox .table-up-selection')).toBeVisible();
    await expect(page.locator('#container2 .table-up-toolbox .table-up-align')).toBeAttached();
    await expect(page.locator('#container2 .table-up-menu')).toBeAttached();
    await expect(page.locator('#container2 .table-up-toolbox .table-up-scrollbar__container')).toBeAttached();
    await expect(page.locator('#container2 .table-up-toolbox .table-up-resize-box')).toBeAttached();
    await expect(page.locator('#container2 .table-up-toolbox .table-up-scale')).toBeAttached();
    await editorPage.setContents([{ insert: 'replace' }]);
    await page.waitForTimeout(1000);
    await expect(page.locator('#container2 .table-up-toolbox .table-up-selection')).not.toBeVisible();
    await expect(page.locator('#container2 .table-up-toolbox .table-up-align')).not.toBeVisible();
    await expect(page.locator('#container2 .table-up-menu')).not.toBeVisible();
    await expect(page.locator('#container2 .table-up-toolbox .table-up-scrollbar__container')).not.toBeVisible();
    await expect(page.locator('#container1 .table-up-toolbox .table-up-scrollbar__container .table-up-scrollbar.is-vertical')).not.toBeAttached();
    await expect(page.locator('#container1 .table-up-toolbox .table-up-scrollbar__container .table-up-scrollbar.is-horizontal')).not.toBeAttached();
    await expect(page.locator('#container2 .table-up-toolbox .table-up-resize-box')).not.toBeVisible();
    await expect(page.locator('#container2 .table-up-toolbox .table-up-scale')).not.toBeVisible();
  });
});

extendTest('remove list in cell should work correctly', async ({ page, editorPage }) => {
  editorPage.index = 0;
  await editorPage.setContents([
    { insert: '\n' },
    { insert: { 'table-up-col': { tableId: 'dg216cyh1hh', colId: 'rbeybfr14n', full: false, width: 373 } } },
    { insert: { 'table-up-col': { tableId: 'dg216cyh1hh', colId: '4yqh0essvp3', full: false, width: 373 } } },
    { insert: '123' },
    { attributes: { 'list': 'ordered', 'table-up-cell-inner': { tableId: 'dg216cyh1hh', rowId: '2lreudvqubb', colId: 'rbeybfr14n', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { insert: '123' },
    { attributes: { 'list': 'ordered', 'table-up-cell-inner': { tableId: 'dg216cyh1hh', rowId: '2lreudvqubb', colId: 'rbeybfr14n', rowspan: 1, colspan: 1 } }, insert: '\n\n' },
    { attributes: { 'table-up-cell-inner': { tableId: 'dg216cyh1hh', rowId: '2lreudvqubb', colId: '4yqh0essvp3', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { insert: '\n' },
  ]);
  await page.waitForTimeout(1000);
  await editorPage.setSelection(11, 0);

  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');

  expect(await page.locator('#editor1 .ql-editor .ql-table li').count()).toBe(2);
});

extendTest.describe('convert table cell', () => {
  extendTest('convert td to th', async ({ page, editorPage }) => {
    editorPage.index = 0;
    await createTableBySelect(page, 'container1', 3, 3);
    await page.locator('#editor1 .ql-editor .ql-table td').nth(0).click();
    await page.locator('#editor1 .ql-editor .ql-table td').nth(0).click({ button: 'right' });
    await page.locator('.table-up-menu.is-contextmenu .table-up-menu__item').filter({ hasText: 'Toggle td between th' }).first().click();
    expect(await page.locator('#editor1 .ql-editor .ql-table td').count()).toBe(8);
    expect(await page.locator('#editor1 .ql-editor .ql-table th').count()).toBe(1);
  });

  extendTest('convert th to td', async ({ page, editorPage }) => {
    editorPage.index = 0;
    await editorPage.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 100 } } },
      { insert: '1' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'th' } }, insert: '\n' },
      { insert: '2' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '3' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '4' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '5' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '6' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '7' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '8' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '9' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);
    await page.waitForTimeout(1000);
    await page.locator('#editor1 .ql-editor .ql-table th').nth(0).click();
    await page.locator('#editor1 .ql-editor .ql-table th').nth(0).click({ button: 'right' });
    await page.locator('.table-up-menu.is-contextmenu .table-up-menu__item').filter({ hasText: 'Toggle td between th' }).first().click();
    expect(await page.locator('#editor1 .ql-editor .ql-table td').count()).toBe(9);
    expect(await page.locator('#editor1 .ql-editor .ql-table th').count()).toBe(0);
  });
});

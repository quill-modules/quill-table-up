import { expect } from '@playwright/test';
import { extendTest as test } from './utils';

test.beforeEach(async ({ page }) => {
  await page.goto('http://127.0.0.1:5500/docs/test.html');
  page.locator('.ql-container.ql-snow');
});

test('tableCaption switch visiable', async ({ page, editorPage }) => {
  editorPage.index = 0;
  await editorPage.setContents([
    { insert: '\nTable Caption' },
    { attributes: { 'table-up-caption': { tableId: '1', side: 'top' } }, insert: '\n' },
    { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
    { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
    { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 100 } } },
    { insert: '1' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
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

  const captionSwitch = page.locator('#editor1 .ql-editor .ql-table caption.ql-table-caption .ql-table-caption--switch').nth(0);
  await expect(captionSwitch).not.toBeVisible();

  const boundingBox = (await page.locator('#editor1 .ql-editor .ql-table caption.ql-table-caption').boundingBox())!;
  expect(boundingBox).not.toBeNull();
  await page.mouse.move(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2);
  await expect(captionSwitch).toBeVisible();
  await page.mouse.move(0, 0);
  await expect(captionSwitch).not.toBeVisible();
});

test('text tableCaption insert', async ({ page, editorPage }) => {
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
  await expect(page.locator('#container1 .table-up-toolbox .table-up-selection .table-up-selection__line')).toBeVisible();
  await cell.click({ button: 'right' });
  await page.locator('.table-up-menu.is-contextmenu .table-up-menu__item').filter({ hasText: 'Insert table caption' }).first().click();

  const caption = page.locator('#container1 .ql-table caption');
  const tbody = page.locator('#container1 .ql-table tbody');
  await expect(caption).toBeVisible();
  expect(await caption.textContent()).toContain('Table Caption');
  const captionBox = (await caption.boundingBox())!;
  const tbodyBox = (await tbody.boundingBox())!;
  expect(captionBox).not.toBeNull();
  expect(tbodyBox).not.toBeNull();
  expect(captionBox.y).toBeLessThan(tbodyBox.y);
});

test('tableCaption side switch', async ({ page, editorPage }) => {
  editorPage.index = 0;
  await editorPage.setContents([
    { insert: '\nTable Caption' },
    { attributes: { 'table-up-caption': { tableId: '1', side: 'top' } }, insert: '\n' },
    { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
    { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
    { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 100 } } },
    { insert: '1' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
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

  const captionUINode = page.locator('#container1 .ql-table caption .ql-ui');
  expect(captionUINode).not.toBeNull();

  const caption = page.locator('#container1 .ql-table caption');
  const boundingBox = (await caption.boundingBox())!;
  expect(caption).not.toBeNull();
  await page.mouse.move(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2);
  await expect(captionUINode).toBeVisible();
  await page.mouse.move(0, 0);
  await expect(captionUINode).not.toBeVisible();

  editorPage.enable(false);
  await page.mouse.move(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2);
  await expect(captionUINode).not.toBeVisible();
});

import { expect } from '@playwright/test';
import { createTableBySelect, extendTest as test } from './utils';

test.beforeEach(async ({ page }) => {
  await page.goto('http://127.0.0.1:5500/docs/test.html');
  page.locator('.ql-container.ql-snow');
});

test('test TableAlign should functional', async ({ page }) => {
  await createTableBySelect(page, 'container1', 3, 3);
  const centerCell = page.locator('#editor1').getByRole('cell').nth(4);
  await centerCell.click();
  const cellBounding = (await centerCell.boundingBox())!;
  expect(cellBounding).not.toBeNull();
  await page.mouse.move(cellBounding.x, cellBounding.y);
  const colBoundingBox = (await page.locator('#editor1 .table-up-resize-line__col').boundingBox())!;
  expect(colBoundingBox).not.toBeNull();
  await page.mouse.move(colBoundingBox.x + colBoundingBox.width / 2, colBoundingBox.y + colBoundingBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(colBoundingBox.x + colBoundingBox.width / 2 - 200, colBoundingBox.y + colBoundingBox.height / 2);
  await page.mouse.up();

  expect(await page.locator('#editor1 .table-up-align').isVisible()).toBeTruthy();

  const table = page.locator('#editor1 .ql-editor .ql-table');
  await page.locator('#editor1 .table-up-align .table-up-align__item[data-align="center"]').click();
  await expect(table).toHaveCSS('margin-left', `100px`);
  await expect(table).toHaveCSS('margin-right', `100px`);

  await page.locator('#editor1 .table-up-align .table-up-align__item[data-align="right"]').click();
  await expect(table).toHaveCSS('margin-left', `200px`);
  await expect(table).toHaveCSS('margin-right', '0px');

  await page.locator('#editor1 .table-up-align .table-up-align__item[data-align="left"]').click();
  await expect(table).toHaveCSS('margin-left', '0px');
  await expect(table).toHaveCSS('margin-right', '200px');
});

test('test TableAlign should update after resize', async ({ page }) => {
  await createTableBySelect(page, 'container1', 3, 3);
  const centerCell = page.locator('#editor1').getByRole('cell').nth(4);
  await centerCell.click();
  const cellBounding = (await centerCell.boundingBox())!;
  expect(cellBounding).not.toBeNull();
  const alignToolbar = page.locator('#editor1 .table-up-align');
  expect(await alignToolbar.isVisible()).toBeTruthy();
  const alignToolbarBoundingBox = (await alignToolbar.boundingBox())!;
  expect(alignToolbarBoundingBox).not.toBeNull();

  await page.mouse.move(cellBounding.x + cellBounding.width / 2, cellBounding.y + cellBounding.height / 2);
  const rowBoundingBox = (await page.locator('#editor1 .table-up-resize-line__row').boundingBox())!;
  expect(rowBoundingBox).not.toBeNull();

  await page.mouse.move(rowBoundingBox.x + rowBoundingBox.width / 2, rowBoundingBox.y + rowBoundingBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(rowBoundingBox.x + rowBoundingBox.width / 2, rowBoundingBox.y + rowBoundingBox.height / 2 + 200);
  await page.mouse.up();

  expect(await alignToolbar.isVisible()).toBeTruthy();
  const newAlignToolbarBoundingBox = (await alignToolbar.boundingBox())!;
  expect(newAlignToolbarBoundingBox).not.toBeNull();
  // resize used Math.round, numDigits is 1 but not 0.1
  expect(newAlignToolbarBoundingBox.y - alignToolbarBoundingBox.y).toBeCloseTo(200, -1);
});

test('test TableAlign should update when text change', async ({ page, editorPage }) => {
  editorPage.index = 0;
  await editorPage.setContents([
    { insert: '\n' },
    { insert: '\n' },
    { insert: '\n' },
    { insert: '\n' },
    { insert: '\n' },
    { insert: { 'table-up-col': { tableId: '2y50yzsqukx', colId: '7jwlegz1wcx', full: false, width: 50 } } },
    { insert: { 'table-up-col': { tableId: '2y50yzsqukx', colId: 'jzkt5xg4uoe', full: false, width: 50 } } },
    { insert: { 'table-up-col': { tableId: '2y50yzsqukx', colId: 'ya1np2wbu5f', full: false, width: 50 } } },
    { attributes: { 'table-up-cell-inner': { tableId: '2y50yzsqukx', rowId: 'q5927gxiii', colId: '7jwlegz1wcx', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '2y50yzsqukx', rowId: 'q5927gxiii', colId: 'jzkt5xg4uoe', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '2y50yzsqukx', rowId: 'q5927gxiii', colId: 'ya1np2wbu5f', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '2y50yzsqukx', rowId: '269nnst8unz', colId: '7jwlegz1wcx', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '2y50yzsqukx', rowId: '269nnst8unz', colId: 'jzkt5xg4uoe', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '2y50yzsqukx', rowId: '269nnst8unz', colId: 'ya1np2wbu5f', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '2y50yzsqukx', rowId: 'xpwngzum4e', colId: '7jwlegz1wcx', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '2y50yzsqukx', rowId: 'xpwngzum4e', colId: 'jzkt5xg4uoe', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '2y50yzsqukx', rowId: 'xpwngzum4e', colId: 'ya1np2wbu5f', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { insert: '\n' },
  ]);

  const lineBound = (await page.locator('#editor1 .ql-editor > p').first().boundingBox())!;
  expect(lineBound).not.toBeNull();
  await page.locator('#editor1 .ql-table .ql-table-cell').nth(0).click();
  const alignToolbar = page.locator('#container1 .table-up-align');
  await expect(alignToolbar).toBeVisible();
  const toolbarBound = (await alignToolbar.boundingBox())!;
  expect(toolbarBound).not.toBeNull();

  await editorPage.updateContents([{ insert: '12345\n12345' }], 'user');

  await expect(alignToolbar).toBeVisible();
  const newToolbarBound = (await alignToolbar.boundingBox())!;
  expect(toolbarBound).not.toBeNull();

  expect(newToolbarBound.y - toolbarBound.y).toBeCloseTo(lineBound.height, 5);
});

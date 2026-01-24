import type { Locator } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { createTableBySelect, extendTest } from './utils';

test.beforeEach(async ({ page }) => {
  await page.goto('http://127.0.0.1:5500/docs/test.html');
  page.locator('.ql-container.ql-snow');
});
function getTransformValue(elemet: Locator, index: number) {
  return elemet.evaluate((element, { index }) => {
    const matrix = window.getComputedStyle(element).transform;
    const matrixValues = matrix.match(/^matrix\(([^)]+)\)$/)?.[1].split(', ').map(Number);
    return matrixValues ? matrixValues[index] : 0;
  }, { index });
}

test('test TableScrollbar', async ({ page }) => {
  await createTableBySelect(page, 'container2', 3, 3);
  const centerCell = page.locator('#editor2').getByRole('cell').nth(4);
  await centerCell.click();
  const cellBounding = (await centerCell.boundingBox())!;
  expect(cellBounding).not.toBeNull();

  await page.waitForTimeout(200);
  expect(await page.locator('#editor2 .table-up-scrollbar.is-vertical').isVisible()).toBeFalsy();
  expect(await page.locator('#editor2 .table-up-scrollbar.is-horizontal').isVisible()).toBeFalsy();

  const colBoundingBox = (await page.locator('#editor2 .table-up-resize-box__col-separator').nth(1).boundingBox())!;
  expect(colBoundingBox).not.toBeNull();
  await page.mouse.move(colBoundingBox.x + colBoundingBox.width - 4, colBoundingBox.y + 4);
  await page.mouse.down();
  await page.mouse.move(colBoundingBox.x + colBoundingBox.width - 4 + 100, colBoundingBox.y + 4);
  await page.mouse.up();

  await page.mouse.move(cellBounding.x, cellBounding.y);
  await page.waitForTimeout(200);
  expect(await page.locator('#editor2 .table-up-scrollbar.is-vertical').isVisible()).toBeFalsy();
  expect(await page.locator('#editor2 .table-up-scrollbar.is-horizontal').isVisible()).toBeTruthy();
});

extendTest('test TableScrollbar should update when text change', async ({ page, editorPage }) => {
  editorPage.index = 0;
  await editorPage.setContents([
    { insert: '\n' },
    { insert: { 'table-up-col': { tableId: '2y50yzsqukx', colId: '7jwlegz1wcx', full: false, width: 500 } } },
    { insert: { 'table-up-col': { tableId: '2y50yzsqukx', colId: 'jzkt5xg4uoe', full: false, width: 500 } } },
    { insert: { 'table-up-col': { tableId: '2y50yzsqukx', colId: 'ya1np2wbu5f', full: false, width: 500 } } },
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
  const scrollbarHorizontal = page.locator('#container1 .table-up-scrollbar.is-horizontal');
  await expect(scrollbarHorizontal).toBeVisible();
  const scrollbarTop = await getTransformValue(scrollbarHorizontal, 5);

  await editorPage.updateContents([{ insert: '12345\n12345' }], 'user');

  await expect(scrollbarHorizontal).toBeVisible();
  const newScrollbarTop = await getTransformValue(scrollbarHorizontal, 5);
  expect(newScrollbarTop - scrollbarTop).toBeCloseTo(lineBound.height, 0);
});

extendTest('test TableScrollbar should not effect selection', async ({ page, editorPage }) => {
  editorPage.index = 0;
  await editorPage.setContents([
    { insert: '\n' },
    { insert: { 'table-up-col': { tableId: '2y50yzsqukx', colId: '7jwlegz1wcx', full: false, width: 500 } } },
    { insert: { 'table-up-col': { tableId: '2y50yzsqukx', colId: 'jzkt5xg4uoe', full: false, width: 500 } } },
    { insert: { 'table-up-col': { tableId: '2y50yzsqukx', colId: 'ya1np2wbu5f', full: false, width: 500 } } },
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

  await page.locator('#editor1 .ql-table .ql-table-cell').nth(0).click();
  const scrollbarHorizontal = page.locator('#container1 .table-up-scrollbar.is-horizontal .table-up-scrollbar__thumb');
  await expect(scrollbarHorizontal).toBeVisible();
  const bound = (await scrollbarHorizontal.boundingBox())!;
  expect(bound).not.toBeNull();

  await page.mouse.move(bound.x + bound.width / 2, bound.y + bound.height / 2);
  await page.mouse.down();
  expect(await page.evaluate(() => {
    return document.onselectstart?.(new Event('selectstart')) === false;
  })).toBe(true);

  await page.mouse.up();
  expect(await page.evaluate(() => {
    return !document.onselectstart || (document.onselectstart?.(new Event('selectstart')) === true);
  })).toBe(true);
});

extendTest('scrollbar should be no offset when container have padding', async ({ page, editorPage, browserName }) => {
  editorPage.index = 4;
  await editorPage.setContents([
    { insert: '\n' },
    { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 500 } } },
    { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 500 } } },
    { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 500 } } },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { insert: '\n' },
  ]);

  const toolbox = page.locator('#editor5 .table-up-toolbox').nth(0);
  await expect(toolbox).toHaveCSS('left', '20px');
  await expect(toolbox).toHaveCSS('top', '20px');

  await page.locator('#editor5 .ql-editor td').nth(0).click();
  await page.waitForTimeout(1000);
  const selectionBounding = (await page.locator('#editor5 .table-up-selection').boundingBox())!;
  const scrollHorizontalScroll = (await page.locator('#editor5 .table-up-scrollbar.is-horizontal').boundingBox())!;
  expect(scrollHorizontalScroll).not.toBeNull();
  expect(selectionBounding).not.toBeNull();
  if (browserName === 'firefox') {
    // extra 1px for broder
    expect(scrollHorizontalScroll.x).toBe(selectionBounding.x + 3);
  }
  else {
    expect(scrollHorizontalScroll.x).toBe(selectionBounding.x + 2);
  }
});

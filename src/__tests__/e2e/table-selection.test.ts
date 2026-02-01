import { expect, test } from '@playwright/test';
import { createTableBySelect, extendTest } from './utils';

test.beforeEach(async ({ page }) => {
  await page.goto('http://127.0.0.1:5500/docs/test.html');
  page.locator('.ql-container.ql-snow');
});

test('test TableSelection horizontal', async ({ page }) => {
  await createTableBySelect(page, 'container1', 5, 5);
  const cell = page.locator('#editor1 .ql-editor .ql-table td').nth(0);
  await cell.click();
  const cellBounding = (await cell.boundingBox())!;
  expect(cellBounding).not.toBeNull();

  await cell.click();
  const selectionLine = page.locator('#editor1 .table-up-selection__line');
  await expect(selectionLine).toBeVisible();
  await page.mouse.down();
  await page.mouse.move(cellBounding.x + cellBounding.width * 3, cellBounding.y + cellBounding.height / 2);
  await page.mouse.up();

  await expect(selectionLine).toBeVisible();
  expect(
    Number.parseFloat(await selectionLine.evaluate(el => getComputedStyle(el).width)),
  ).toBeCloseTo(cellBounding.width * 3, -1);
  expect(
    Number.parseFloat(await selectionLine.evaluate(el => getComputedStyle(el).height)),
  ).toBeCloseTo(cellBounding.height, -1);

  await cell.click({ button: 'right' });
  await page.locator('.table-up-menu.is-contextmenu .table-up-menu__item').filter({ hasText: 'Merge Cell' }).first().click();

  await page.locator('#editor1 .ql-editor .ql-table td').nth(3).click();
  await page.locator('#editor1 .ql-editor .ql-table td').nth(3).click();
  await expect(selectionLine).toBeVisible();
  await page.mouse.down();
  await page.mouse.move(cellBounding.x + 10, cellBounding.y + 10);
  await page.mouse.up();

  const mergeCellBounding = (await page.locator('#editor1 .ql-editor .ql-table td').nth(0).boundingBox())!;
  expect(mergeCellBounding).not.toBeNull();
  expect(
    Number.parseFloat(await selectionLine.evaluate(el => getComputedStyle(el).width)),
  ).toBeCloseTo(mergeCellBounding.width, -1);
  expect(
    Number.parseFloat(await selectionLine.evaluate(el => getComputedStyle(el).height)),
  ).toBeCloseTo(mergeCellBounding.height + cellBounding.height, -1);
});

test('test TableSelection vertical', async ({ page }) => {
  await createTableBySelect(page, 'container1', 5, 5);
  const cell = page.locator('#editor1 .ql-editor .ql-table td').nth(0);
  const cellBounding = (await cell.boundingBox())!;
  expect(cellBounding).not.toBeNull();
  await cell.click();
  await expect(page.locator('#editor1 .table-up-selection__line')).toBeVisible();

  await page.locator('#editor1 .ql-editor .ql-table td').nth(0).click();
  await page.locator('#editor1 .ql-editor .ql-table td').nth(0).click();
  await expect(page.locator('#editor1 .table-up-selection__line')).toBeVisible();
  await page.mouse.down();
  await page.mouse.move(cellBounding.x + cellBounding.width * 0.5, cellBounding.y + cellBounding.height * 3);
  await page.mouse.up();
  await cell.click({ button: 'right' });
  await page.locator('.table-up-menu.is-contextmenu .table-up-menu__item').filter({ hasText: 'Merge Cell' }).first().click();

  await page.locator('#editor1 .ql-editor .ql-table td').nth(0).click();
  await expect(page.locator('#editor1 .table-up-selection__line')).toBeVisible();
  await page.mouse.down();
  await page.mouse.move(cellBounding.x + cellBounding.width * 1.5, cellBounding.y + cellBounding.height * 0.5);
  await page.mouse.up();

  expect(
    Number.parseFloat(await page.locator('#editor1 .table-up-selection__line').evaluate(el => getComputedStyle(el).width)),
  ).toBeCloseTo(cellBounding.width * 2, -1);
  expect(
    Number.parseFloat(await page.locator('#editor1 .table-up-selection__line').evaluate(el => getComputedStyle(el).height)),
  ).toBeCloseTo(cellBounding.height * 3, -1);
});

test('test TableSelection set format list', async ({ page }) => {
  await createTableBySelect(page, 'container1', 2, 2);
  const cell = page.locator('#editor1 .ql-editor .ql-table td').nth(0);
  const cellBounding = (await cell.boundingBox())!;
  expect(cellBounding).not.toBeNull();
  await cell.click();
  await page.mouse.down();
  await page.mouse.move(cellBounding.x + cellBounding.width * 2 - 10, cellBounding.y + cellBounding.height * 2 - 10);
  await page.mouse.up();

  const item = page.locator('.ql-toolbar .ql-list[value="bullet"]').nth(0);
  await item.click();

  expect(await page.locator('#editor1 .ql-table-cell-inner ol').count()).toBe(4);
});

test('test TableSelection set indent format', async ({ page }) => {
  await createTableBySelect(page, 'container1', 2, 2);
  const cell = page.locator('#editor1 .ql-editor .ql-table td').nth(0);
  const cellBounding = (await cell.boundingBox())!;
  expect(cellBounding).not.toBeNull();
  await cell.click();
  await page.mouse.down();
  await page.mouse.move(cellBounding.x + cellBounding.width * 1.5, cellBounding.y + cellBounding.height * 1.5);
  await page.mouse.up();

  const plus = page.locator('.ql-toolbar .ql-indent[value="+1"]').nth(0);
  await plus.click();
  await plus.click();
  expect(await page.locator('#editor1 .ql-table-cell-inner p.ql-indent-2').count()).toBe(4);

  const reduce = page.locator('.ql-toolbar .ql-indent[value="-1"]').nth(0);
  await reduce.click();
  expect(await page.locator('#editor1 .ql-table-cell-inner p.ql-indent-1').count()).toBe(4);
});

test('test TableSelection set format header', async ({ page }) => {
  await createTableBySelect(page, 'container1', 2, 2);
  const cell = page.locator('#editor1 .ql-editor .ql-table td').nth(0);
  const cellBounding = (await cell.boundingBox())!;
  expect(cellBounding).not.toBeNull();
  await cell.click();
  await page.mouse.down();
  await page.mouse.move(cellBounding.x + cellBounding.width * 2 - 10, cellBounding.y + cellBounding.height * 2 - 10);
  await page.mouse.up();

  await page.locator('#container1 .ql-toolbar .ql-header').nth(0).click();
  await page.locator('#container1 .ql-toolbar .ql-header .ql-picker-options .ql-picker-item').nth(0).click();

  expect(await page.locator('#editor1 .ql-table-cell-inner h1').count()).toBe(4);
});

extendTest('test TableSelection set multiple format', async ({ page, editorPage }) => {
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
  await page.waitForTimeout(1000);
  const cell = page.locator('#editor1 .ql-editor .ql-table td').nth(0);
  const cellBounding = (await cell.boundingBox())!;
  expect(cellBounding).not.toBeNull();
  await cell.click();
  await page.mouse.down();
  await page.mouse.move(cellBounding.x + cellBounding.width * 1.5, cellBounding.y + cellBounding.height * 1.5);
  await page.mouse.up();
  await editorPage.blur();
  await editorPage.focus();

  await page.locator('.ql-toolbar .ql-bold').nth(0).click();
  await page.locator('.ql-toolbar .ql-italic').nth(0).click();
  await page.locator('.ql-toolbar .ql-underline').nth(0).click();
  await page.locator('.ql-toolbar .ql-strike').nth(0).click();
  await page.locator('.ql-toolbar .ql-background.ql-picker').nth(0).click();
  await page.locator('.ql-toolbar .ql-background.ql-picker .ql-picker-item[data-value="#e60000"]').nth(0).click();

  const strongEl = page.locator('#editor1 .ql-table-cell-inner strong');
  expect(await strongEl.count()).toBe(4);
  expect(await page.locator('#editor1 .ql-table-cell-inner em').count()).toBe(4);
  expect(await page.locator('#editor1 .ql-table-cell-inner s').count()).toBe(4);
  expect(await page.locator('#editor1 .ql-table-cell-inner u').count()).toBe(4);
  await strongEl.all().then(async (elements) => {
    for (const element of elements) {
      await expect(element).toHaveCSS('background-color', 'rgb(230, 0, 0)');
    }
  });
});

test('test TableSelection clean format', async ({ page }) => {
  await createTableBySelect(page, 'container1', 2, 2);
  const cell = page.locator('#editor1 .ql-editor .ql-table td').nth(0);
  const cellBounding = (await cell.boundingBox())!;
  expect(cellBounding).not.toBeNull();
  await cell.click();
  await page.mouse.down();
  await page.mouse.move(cellBounding.x + cellBounding.width * 1.5, cellBounding.y + cellBounding.height * 1.5);
  await page.mouse.up();

  await page.locator('#container1 .ql-toolbar .ql-indent[value="+1"]').nth(0).click();
  await page.locator('#container1 .ql-toolbar .ql-header').nth(0).click();
  await page.locator('#container1 .ql-toolbar .ql-header .ql-picker-item[data-value="1"]').nth(0).click();

  const formatEl = page.locator('#editor1 .ql-table-cell-inner h1.ql-indent-1');
  expect(await formatEl.count()).toBe(4);

  await page.locator('#container1 .ql-toolbar .ql-clean').nth(0).click();
  const cleanEl = page.locator('#editor1 .ql-table-cell-inner h1.ql-indent-1');
  expect(await cleanEl.count()).toBe(0);
});

extendTest('test TableSelection set format in part of cell text', async ({ page, editorPage }) => {
  editorPage.index = 0;
  await editorPage.setContents([
    { insert: '\n' },
    { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
    { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
    { insert: '1' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { insert: '1' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { insert: '1' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { insert: '2' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { insert: '2' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { insert: '2' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { insert: '3' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { insert: '4' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { insert: '\n' },
  ]);
  await page.waitForTimeout(1000);
  await page.locator('#editor1 .ql-editor .ql-table td').nth(0).click();

  await editorPage.setSelection(4, 0);
  await page.locator('#container1 .ql-toolbar .ql-header').nth(0).click();
  await page.locator('#container1 .ql-toolbar .ql-header .ql-picker-options .ql-picker-item').nth(0).click();
  const selectionAfterHeader = await editorPage.getSelection();
  expect(selectionAfterHeader).toEqual({ index: 4, length: 0 });

  await editorPage.setSelection(6, 0);
  await page.locator('.ql-toolbar .ql-list[value="bullet"]').nth(0).click();
  const selectionAfterList = await editorPage.getSelection();
  expect(selectionAfterList).toEqual({ index: 6, length: 0 });

  await page.locator('#editor1 .ql-editor .ql-table td').nth(1).click();
  await editorPage.setSelection(9, 3);
  await page.locator('.ql-toolbar .ql-bold').nth(0).click();
  await page.locator('.ql-toolbar .ql-italic').nth(0).click();

  expect(await page.locator('#editor1 .ql-table-cell-inner strong').count()).toBe(2);
  expect(await page.locator('#editor1 .ql-table-cell-inner em').count()).toBe(2);
});

extendTest('test TableSelection should update when text change', async ({ page, editorPage }) => {
  editorPage.index = 0;
  await createTableBySelect(page, 'container1', 3, 3);

  const lineBound = (await page.locator('#editor1 .ql-editor > p').first().boundingBox())!;
  expect(lineBound).not.toBeNull();

  await page.locator('#editor1 .ql-table .ql-table-cell').nth(0).click();
  const selectionWrapper = page.locator('#container1 .table-up-selection');
  await expect(selectionWrapper).toBeVisible();
  const selectionBound = (await selectionWrapper.boundingBox())!;
  expect(selectionBound).not.toBeNull();

  await editorPage.updateContents([{ insert: '12345\n12345' }], 'user');

  await expect(selectionWrapper).toBeVisible();
  const newSelectionWrapper = (await selectionWrapper.boundingBox())!;
  expect(newSelectionWrapper).not.toBeNull();
  expect(newSelectionWrapper.y - selectionBound.y).toBeCloseTo(lineBound.height, 5);
});

extendTest('test TableSelection should hide if selectedTds no longer in page', async ({ page, editorPage }) => {
  editorPage.index = 0;
  await createTableBySelect(page, 'container1', 3, 3);
  await page.waitForTimeout(1000);

  const cell1Bound = (await page.locator('#editor1 .ql-editor td').nth(0).boundingBox())!;
  expect(cell1Bound).not.toBeNull();
  const cell5Bound = (await page.locator('#editor1 .ql-editor td').nth(4).boundingBox())!;
  expect(cell5Bound).not.toBeNull();

  await page.locator('#editor1 .ql-editor td').nth(0).click();
  await page.mouse.move(cell1Bound.x + cell1Bound.width / 2, cell1Bound.y + cell1Bound.height / 2);
  await page.mouse.down();
  await page.mouse.move(cell5Bound.x + cell5Bound.width / 2, cell5Bound.y + cell5Bound.height / 2);
  await page.mouse.up();
  await page.locator('#editor1 .ql-editor td').nth(4).click({ button: 'right' });
  await page.locator('.table-up-menu.is-contextmenu .table-up-menu__item').filter({ hasText: 'Merge cell' }).first().click();
  await page.locator('#editor1 .ql-editor td').nth(0).click();
  await page.waitForTimeout(1000);

  const selection = page.locator('#container1 .table-up-selection .table-up-selection__line');
  await expect(selection).toBeVisible();
  const selectionBound = (await selection.boundingBox())!;
  expect(selectionBound).not.toBeNull();
  const mergedCellBound = (await page.locator('#editor1 .ql-editor td').nth(0).boundingBox())!;
  expect(mergedCellBound).not.toBeNull();
  expect(selectionBound).toEqual(mergedCellBound);

  await page.keyboard.press('Control+z');
  await expect(page.locator('#container1 .table-up-selection .table-up-selection__line')).not.toBeVisible();
});

extendTest('test TableSelection should update when table resize', async ({ page, editorPage }) => {
  editorPage.index = 0;
  await createTableBySelect(page, 'container1', 3, 3);

  await page.locator('#editor1 .ql-table .ql-table-cell').nth(0).click();
  const selection = page.locator('#container1 .table-up-selection .table-up-selection__line');
  await expect(selection).toBeVisible();
  const selectionBound = (await selection.boundingBox())!;
  expect(selectionBound).not.toBeNull();

  await page.locator('#editor1').getByRole('cell').nth(4).click();
  const colBoundingBox = (await page.locator('#editor1 .table-up-resize-line__col').boundingBox())!;
  expect(colBoundingBox).not.toBeNull();
  await page.mouse.move(colBoundingBox.x + colBoundingBox.width / 2, colBoundingBox.y + colBoundingBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(colBoundingBox.x + colBoundingBox.width / 2 + 100, colBoundingBox.y + colBoundingBox.height / 2);
  await page.mouse.up();

  await expect(selection).toBeVisible();
  const newSelectionBound = (await selection.boundingBox())!;
  expect(newSelectionBound).not.toBeNull();
  expect(newSelectionBound.width).toBeCloseTo(selectionBound.width + 100, 5);
});

extendTest('table resize should update TableSelection', async ({ page, editorPage }) => {
  editorPage.index = 0;
  await createTableBySelect(page, 'container1', 3, 3);

  await page.locator('#editor1 .ql-table .ql-table-cell').nth(0).click();
  const selection = page.locator('#container1 .table-up-selection .table-up-selection__line');
  await page.locator('#editor1').getByRole('cell').nth(2).click();
  await expect(selection).toBeVisible();

  await editorPage.updateContents(
    [
      { retain: 6 },
      { insert: { image: 'https://71f32f3f-ce5e-4222-95b1-a8f7b05ea469.mdnplay.dev/shared-assets/images/examples/grapefruit-slice.jpg' } },
    ],
  );
  await page.waitForSelector('#editor1 img');

  const newThirdCellSelectionBound = (await selection.boundingBox())!;
  expect(newThirdCellSelectionBound).not.toBeNull();
  const newCellBound = (await page.locator('#editor1').getByRole('cell').nth(2).boundingBox())!;
  expect(newCellBound).not.toBeNull();
  expect(newThirdCellSelectionBound).toEqual(newCellBound);
});

extendTest('selection should be no offset when container have padding', async ({ page, editorPage }) => {
  editorPage.index = 4;
  await editorPage.setContents([
    { insert: '\n' },
    { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 300 } } },
    { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 300 } } },
    { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 300 } } },
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

  const tableBounding = (await page.locator('#editor5 .ql-editor .ql-table-wrapper').boundingBox())!;
  const selectionBounding = (await page.locator('#editor5 .table-up-selection').boundingBox())!;
  expect(tableBounding).not.toBeNull();
  expect(selectionBounding).not.toBeNull();
  expect(tableBounding.x).toBe(selectionBounding.x);
  expect(tableBounding.y).toBe(selectionBounding.y);
});

extendTest('toolbox bounds should same with quill.root', async ({ page, editorPage }) => {
  editorPage.index = 4;
  const toolbox = page.locator('#editor5 .table-up-toolbox').nth(0);
  const quillRoot = page.locator('#editor5 .ql-editor').nth(0);
  const toolboxBoundingBefore = (await toolbox.boundingBox())!;
  const quillRootBoundingBefore = (await quillRoot.boundingBox())!;
  expect(toolboxBoundingBefore).not.toBeNull();
  expect(quillRootBoundingBefore).not.toBeNull();
  expect(toolboxBoundingBefore).toEqual(quillRootBoundingBefore);

  await editorPage.setContents([
    { insert: '\n' },
    { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 300 } } },
    { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 300 } } },
    { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 300 } } },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { insert: '\n' },
  ]);

  const toolboxBoundingAfter = (await toolbox.boundingBox())!;
  const quillRootBoundingAfter = (await quillRoot.boundingBox())!;
  expect(toolboxBoundingAfter).not.toBeNull();
  expect(quillRootBoundingAfter).not.toBeNull();
  expect(toolboxBoundingAfter).toEqual(quillRootBoundingAfter);
});

extendTest('TableSelection should not update when input composition', async ({ page, editorPage }) => {
  editorPage.index = 0;
  await createTableBySelect(page, 'container1', 3, 3);

  await page.locator('#editor1 .ql-table .ql-table-cell').nth(0).click();
  const selectionLine = page.locator('#container1 .table-up-selection .table-up-selection__line');
  await expect(selectionLine).toBeVisible();
  const bounding = (await selectionLine.boundingBox())!;
  expect(bounding).not.toBeNull();

  await page.dispatchEvent('#editor1 .ql-editor .ql-table-cell', 'compositionstart');
  await page.type('#editor1 .ql-editor .ql-table-cell', 'zhongwen');

  const composingBounding = (await selectionLine.boundingBox())!;
  expect(composingBounding).toEqual(bounding);
});

extendTest('TableSelection should allow text selection when editor is not editable', async ({ page, editorPage }) => {
  editorPage.index = 0;
  await editorPage.setContents([
    { insert: '\n' },
    { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 150 } } },
    { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 150 } } },
    { insert: 'Hello World' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { insert: 'Test Content' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { insert: '\n' },
  ]);
  await page.waitForTimeout(500);

  // Disable editor (set contenteditable to false)
  await editorPage.enable(false);
  await page.waitForTimeout(100);

  // Verify editor is not editable
  const isEditable = await page.locator('#editor1 .ql-editor').getAttribute('contenteditable');
  expect(isEditable).toBe('false');

  // Get two cells with text content
  const cell0 = page.locator('#editor1 .ql-editor td').nth(0);
  const cell1 = page.locator('#editor1 .ql-editor td').nth(1);
  const cell0Bounding = (await cell0.boundingBox())!;
  const cell1Bounding = (await cell1.boundingBox())!;
  expect(cell0Bounding).not.toBeNull();
  expect(cell1Bounding).not.toBeNull();

  // Perform text selection by dragging from first cell to second cell
  await page.mouse.move(cell0Bounding.x + 5, cell0Bounding.y + cell0Bounding.height / 2);
  await page.mouse.down();
  await page.mouse.move(cell1Bounding.x + 5, cell1Bounding.y + cell1Bounding.height * 2);
  await page.mouse.up();

  // Verify that text can be selected across cells (native selection should work)
  const selectedText = await page.evaluate(() => {
    const selection = window.getSelection();
    return selection?.toString() || '';
  });

  // Should be able to select text content across multiple cells in non-editable mode
  expect(selectedText.length).toBeGreaterThan(0);
  expect(selectedText).toContain('Hello');
  expect(selectedText).toContain('Test');
});

extendTest.describe('TableSelection should work correct when wrapper scroll', () => {
  extendTest('TableSelection in quill root scroll', async ({ page, editorPage }) => {
    editorPage.index = 0;
    await editorPage.setContents([
      { insert: '\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n' },
      { insert: { 'table-up-col': { tableId: 'q9rcu2l5en', colId: 'odojvz7psp8', full: false, width: 400 } } },
      { insert: { 'table-up-col': { tableId: 'q9rcu2l5en', colId: 'thtn1vm1a0l', full: false, width: 400 } } },
      { insert: { 'table-up-col': { tableId: 'q9rcu2l5en', colId: '6ci2o6ophk8', full: false, width: 400 } } },
      { insert: { 'table-up-col': { tableId: 'q9rcu2l5en', colId: 'k7jzkt8ede8', full: false, width: 400 } } },
      { insert: { 'table-up-col': { tableId: 'q9rcu2l5en', colId: '6nj5cy7mrat', full: false, width: 400 } } },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: '1zdvvq78kqa', colId: 'odojvz7psp8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: '1zdvvq78kqa', colId: 'thtn1vm1a0l', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: '1zdvvq78kqa', colId: '6ci2o6ophk8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: '1zdvvq78kqa', colId: 'k7jzkt8ede8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: '1zdvvq78kqa', colId: '6nj5cy7mrat', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'kkyehoxutvs', colId: 'odojvz7psp8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'kkyehoxutvs', colId: 'thtn1vm1a0l', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'kkyehoxutvs', colId: '6ci2o6ophk8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'kkyehoxutvs', colId: 'k7jzkt8ede8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'kkyehoxutvs', colId: '6nj5cy7mrat', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'ife4q2in0se', colId: 'odojvz7psp8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'ife4q2in0se', colId: 'thtn1vm1a0l', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'ife4q2in0se', colId: '6ci2o6ophk8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'ife4q2in0se', colId: 'k7jzkt8ede8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'ife4q2in0se', colId: '6nj5cy7mrat', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'waafccgk7yk', colId: 'odojvz7psp8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'waafccgk7yk', colId: 'thtn1vm1a0l', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'waafccgk7yk', colId: '6ci2o6ophk8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'waafccgk7yk', colId: 'k7jzkt8ede8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'waafccgk7yk', colId: '6nj5cy7mrat', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'lb7s1smtyh', colId: 'odojvz7psp8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'lb7s1smtyh', colId: 'thtn1vm1a0l', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'lb7s1smtyh', colId: '6ci2o6ophk8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'lb7s1smtyh', colId: 'k7jzkt8ede8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'lb7s1smtyh', colId: '6nj5cy7mrat', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'jgvhoknv7tf', colId: 'odojvz7psp8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'jgvhoknv7tf', colId: 'thtn1vm1a0l', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'jgvhoknv7tf', colId: '6ci2o6ophk8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'jgvhoknv7tf', colId: 'k7jzkt8ede8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'jgvhoknv7tf', colId: '6nj5cy7mrat', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'bxqnf58tmfd', colId: 'odojvz7psp8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'bxqnf58tmfd', colId: 'thtn1vm1a0l', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'bxqnf58tmfd', colId: '6ci2o6ophk8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'bxqnf58tmfd', colId: 'k7jzkt8ede8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'bxqnf58tmfd', colId: '6nj5cy7mrat', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'dctaip1l39v', colId: 'odojvz7psp8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'dctaip1l39v', colId: 'thtn1vm1a0l', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'dctaip1l39v', colId: '6ci2o6ophk8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'dctaip1l39v', colId: 'k7jzkt8ede8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'dctaip1l39v', colId: '6nj5cy7mrat', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { insert: '\n\n\n\n\n\n\n\n\n\n\n\n\n' },
    ]);
    await page.waitForTimeout(1000);

    await page.locator('#editor1 .ql-editor td').nth(0).click();
    await page.mouse.down();
    await page.mouse.wheel(0, 200);
    await page.mouse.wheel(500, 0);
    await page.waitForTimeout(1000);
    const bounding = (await page.locator('#editor1 .ql-editor td').nth(12).boundingBox())!;
    expect(bounding).not.toBeNull();
    await page.mouse.move(bounding.x + bounding.width / 2, bounding.y + bounding.height / 2);

    const selectedTds = await page.evaluate(() => {
      return (window.quills[0].getModule('table-up') as any).getModule('table-selection')!.selectedTds;
    });
    expect(selectedTds.length).toBe(9);
  });

  extendTest('TableSelection in body scroll', async ({ page, editorPage }) => {
    editorPage.index = 4;
    await editorPage.setContents([
      { insert: '\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n' },
      { insert: { 'table-up-col': { tableId: 'q9rcu2l5en', colId: 'odojvz7psp8', full: false, width: 400 } } },
      { insert: { 'table-up-col': { tableId: 'q9rcu2l5en', colId: 'thtn1vm1a0l', full: false, width: 400 } } },
      { insert: { 'table-up-col': { tableId: 'q9rcu2l5en', colId: '6ci2o6ophk8', full: false, width: 400 } } },
      { insert: { 'table-up-col': { tableId: 'q9rcu2l5en', colId: 'k7jzkt8ede8', full: false, width: 400 } } },
      { insert: { 'table-up-col': { tableId: 'q9rcu2l5en', colId: '6nj5cy7mrat', full: false, width: 400 } } },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: '1zdvvq78kqa', colId: 'odojvz7psp8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: '1zdvvq78kqa', colId: 'thtn1vm1a0l', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: '1zdvvq78kqa', colId: '6ci2o6ophk8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: '1zdvvq78kqa', colId: 'k7jzkt8ede8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: '1zdvvq78kqa', colId: '6nj5cy7mrat', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'kkyehoxutvs', colId: 'odojvz7psp8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'kkyehoxutvs', colId: 'thtn1vm1a0l', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'kkyehoxutvs', colId: '6ci2o6ophk8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'kkyehoxutvs', colId: 'k7jzkt8ede8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'kkyehoxutvs', colId: '6nj5cy7mrat', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'ife4q2in0se', colId: 'odojvz7psp8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'ife4q2in0se', colId: 'thtn1vm1a0l', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'ife4q2in0se', colId: '6ci2o6ophk8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'ife4q2in0se', colId: 'k7jzkt8ede8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'ife4q2in0se', colId: '6nj5cy7mrat', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'waafccgk7yk', colId: 'odojvz7psp8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'waafccgk7yk', colId: 'thtn1vm1a0l', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'waafccgk7yk', colId: '6ci2o6ophk8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'waafccgk7yk', colId: 'k7jzkt8ede8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'waafccgk7yk', colId: '6nj5cy7mrat', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'lb7s1smtyh', colId: 'odojvz7psp8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'lb7s1smtyh', colId: 'thtn1vm1a0l', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'lb7s1smtyh', colId: '6ci2o6ophk8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'lb7s1smtyh', colId: 'k7jzkt8ede8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'lb7s1smtyh', colId: '6nj5cy7mrat', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'jgvhoknv7tf', colId: 'odojvz7psp8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'jgvhoknv7tf', colId: 'thtn1vm1a0l', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'jgvhoknv7tf', colId: '6ci2o6ophk8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'jgvhoknv7tf', colId: 'k7jzkt8ede8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'jgvhoknv7tf', colId: '6nj5cy7mrat', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'bxqnf58tmfd', colId: 'odojvz7psp8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'bxqnf58tmfd', colId: 'thtn1vm1a0l', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'bxqnf58tmfd', colId: '6ci2o6ophk8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'bxqnf58tmfd', colId: 'k7jzkt8ede8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'bxqnf58tmfd', colId: '6nj5cy7mrat', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'dctaip1l39v', colId: 'odojvz7psp8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'dctaip1l39v', colId: 'thtn1vm1a0l', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'dctaip1l39v', colId: '6ci2o6ophk8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'dctaip1l39v', colId: 'k7jzkt8ede8', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'q9rcu2l5en', rowId: 'dctaip1l39v', colId: '6nj5cy7mrat', rowspan: 1, colspan: 1, style: 'height: 100px;' } }, insert: '\n' },
      { insert: '\n\n\n\n\n\n\n\n\n\n\n\n\n' },
    ]);
    await page.waitForTimeout(1000);

    await page.locator('#editor5 .ql-editor td').nth(0).click();
    await page.mouse.down();
    await page.mouse.wheel(500, 200);
    await page.waitForTimeout(1000);
    const bounding = (await page.locator('#editor5 .ql-editor td').nth(12).boundingBox())!;
    expect(bounding).not.toBeNull();
    await page.mouse.move(bounding.x + bounding.width / 2, bounding.y + bounding.height / 2);

    const selectedTds = await page.evaluate(() => {
      return (window.quills[4].getModule('table-up') as any).getModule('table-selection')!.selectedTds;
    });
    expect(selectedTds.length).toBe(9);
  });
});

import { expect, test } from '@playwright/test';
import { createTableBySelect, extendTest } from './utils';

test.beforeEach(async ({ page }) => {
  await page.goto('http://127.0.0.1:5500/docs/test.html');
  page.locator('.ql-container.ql-snow');
});

test('test TableResizeLine fixed width', async ({ page }) => {
  await createTableBySelect(page, 'container1', 3, 3);
  const centerCell = page.locator('#editor1').getByRole('cell').nth(4);
  await centerCell.click();
  const cellBounding = (await centerCell.boundingBox())!;
  expect(cellBounding).not.toBeNull();

  // col
  await page.mouse.move(cellBounding.x + 10, cellBounding.y + 10);
  const colBoundingBox = (await page.locator('#editor1 .table-up-resize-line__col').boundingBox())!;
  expect(colBoundingBox).not.toBeNull();
  await page.mouse.move(colBoundingBox.x + colBoundingBox.width / 2, colBoundingBox.y + colBoundingBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(colBoundingBox.x + colBoundingBox.width / 2 + 100, colBoundingBox.y + colBoundingBox.height / 2);
  await page.mouse.up();
  expect(page.locator('#editor1 .ql-table-wrapper col').nth(1)).toHaveAttribute('width', `${Math.floor(cellBounding.width) + 100}px`);
  await page.mouse.move(cellBounding.x, cellBounding.y);

  // row
  await page.mouse.move(cellBounding.x + 10, cellBounding.y + 10);
  const rowBoundingBox = (await page.locator('#editor1 .table-up-resize-line__row').boundingBox())!;
  expect(rowBoundingBox).not.toBeNull();
  await page.mouse.move(rowBoundingBox.x + rowBoundingBox.width / 2, rowBoundingBox.y + rowBoundingBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(rowBoundingBox.x + rowBoundingBox.width / 2, rowBoundingBox.y + rowBoundingBox.height / 2 + 100);
  await page.mouse.up();
  const cells = await page.locator('#editor1 .ql-table-wrapper tr').nth(1).locator('td').all();
  for (const cell of cells) {
    expect(cell).toHaveAttribute('style');
    const styleAttribute = (await cell.getAttribute('style'))!;
    const heightMatch = styleAttribute?.match(/height\s*:\s*([^;]+)/);
    const heightValue = heightMatch ? heightMatch[1].trim() : null;
    expect(heightValue).not.toBeNull();
    expect(Number.parseFloat(heightValue!)).toBeCloseTo(cellBounding.height + 100, 3);
  }
});

test('test TableResizeBox fixed width', async ({ page }) => {
  await createTableBySelect(page, 'container2', 3, 3);
  const centerCell = page.locator('#editor2').getByRole('cell').nth(4);
  await centerCell.click();
  const cellBounding = (await centerCell.boundingBox())!;
  expect(cellBounding).not.toBeNull();

  // col
  const colBoundingBox = await page.locator('#editor2 .table-up-resize-box__col-separator').nth(1).boundingBox();
  expect(colBoundingBox).not.toBeNull();
  if (!colBoundingBox) {
    throw new Error('colBoundingBox is null');
  }
  await page.mouse.move(colBoundingBox.x, colBoundingBox.y + 4);
  await page.mouse.down();
  await page.mouse.move(colBoundingBox.x + 100 + 1, colBoundingBox.y);
  await page.mouse.up();
  expect(page.locator('#editor2 .ql-table-wrapper col').nth(1)).toHaveAttribute('width', `${Math.floor(cellBounding.width) + 100}px`);

  // row
  const rowBoundingBox = await page.locator('#editor2 .table-up-resize-box__row-separator').nth(1).boundingBox();
  expect(rowBoundingBox).not.toBeNull();
  if (!rowBoundingBox) {
    throw new Error('rowBoundingBox is null');
  }
  await page.mouse.move(rowBoundingBox.x + 4, rowBoundingBox.y + rowBoundingBox.height - 4);
  await page.mouse.down();
  await page.mouse.move(rowBoundingBox.x + 4, rowBoundingBox.y + rowBoundingBox.height - 4 + 100 + 1);
  await page.mouse.up();
  const cells = await page.locator('#editor2 .ql-table-wrapper tr').nth(1).locator('td').all();
  expect(cells.length).toEqual(3);
  for (const cell of cells) {
    expect(cell).toHaveAttribute('style');
    const styleAttribute = (await cell.getAttribute('style'))!;
    const heightMatch = styleAttribute?.match(/height\s*:\s*([^;]+)/);
    const heightValue = heightMatch ? heightMatch[1].trim() : null;
    expect(heightValue).not.toBeNull();
    expect(Number.parseFloat(heightValue!)).toBeCloseTo(cellBounding.height + 100, 3);
  }
});

test('test TableResizeLine full width', async ({ page }) => {
  await createTableBySelect(page, 'container3', 4, 4);
  const centerCell = page.locator('#editor3').getByRole('cell').nth(1);
  await centerCell.click();
  const cellBounding = (await centerCell.boundingBox())!;
  const tableBounding = (await page.locator('#editor3 .ql-table').boundingBox())!;
  expect(cellBounding).not.toBeNull();
  expect(tableBounding).not.toBeNull();

  await page.mouse.move(cellBounding.x + cellBounding.width / 2, cellBounding.y + cellBounding.height / 2);
  const colBoundingBox = (await page.locator('#editor3 .table-up-resize-line__col').boundingBox())!;
  expect(colBoundingBox).not.toBeNull();
  await page.mouse.move(colBoundingBox.x + colBoundingBox.width / 2, colBoundingBox.y + cellBounding.height / 2);
  await page.mouse.down();
  await page.mouse.move(colBoundingBox.x + colBoundingBox.width / 2 + tableBounding.width * 0.05, colBoundingBox.y + cellBounding.height / 2);
  await page.mouse.up();
  const cols = page.locator('#editor3 .ql-table-wrapper col');
  await expect(cols.nth(1)).toHaveAttribute('width');
  expect(Number.parseFloat((await cols.nth(1).getAttribute('width'))!)).toBeCloseTo(30, 1);
  await expect(cols.nth(2)).toHaveAttribute('width');
  expect(Number.parseFloat((await cols.nth(2).getAttribute('width'))!)).toBeCloseTo(20, 1);
});

test('test TableResizeBox full width', async ({ page }) => {
  await createTableBySelect(page, 'container4', 4, 4);
  const centerCell = page.locator('#editor4').getByRole('cell').nth(1);
  await centerCell.click();
  const cellBounding = (await centerCell.boundingBox())!;
  const tableBounding = (await page.locator('#editor4 .ql-table').boundingBox())!;
  expect(cellBounding).not.toBeNull();
  expect(tableBounding).not.toBeNull();

  const colBoundingBox = (await page.locator('#editor4 .table-up-resize-box__col-separator').nth(1).boundingBox())!;
  expect(colBoundingBox).not.toBeNull();
  await page.mouse.move(colBoundingBox.x, colBoundingBox.y + 4);
  await page.mouse.down();
  await page.mouse.move(colBoundingBox.x + tableBounding.width * 0.05 + 1, colBoundingBox.y);
  await page.mouse.up();
  const cols = page.locator('#editor4 .ql-table-wrapper col');
  await expect(cols.nth(1)).toHaveAttribute('width');
  expect(Number.parseFloat((await cols.nth(1).getAttribute('width'))!)).toBeCloseTo(30, 1);
  await expect(cols.nth(2)).toHaveAttribute('width');
  expect(Number.parseFloat((await cols.nth(2).getAttribute('width'))!)).toBeCloseTo(20, 1);
});

test('test TableResizeBox position', async ({ page }) => {
  await createTableBySelect(page, 'container2', 3, 3);

  const firstCell = page.locator('#editor2').getByRole('cell').nth(0);
  await firstCell.click();
  const firstCellBounding = (await firstCell.boundingBox())!;
  expect(firstCellBounding).not.toBeNull();
  const toolBounding = (await page.locator('#editor2 .table-up-toolbox .table-up-resize-box').boundingBox())!;
  expect(toolBounding).not.toBeNull();
  expect(firstCellBounding.x).toEqual(toolBounding.x);
  expect(firstCellBounding.y).toEqual(toolBounding.y);
});

extendTest('TableResize on full width should not outer 100%', async ({ page, editorPage }) => {
  editorPage.index = 3;
  await createTableBySelect(page, 'container4', 3, 7);

  const centerCell = page.locator('#editor4').getByRole('cell').nth(1);
  await centerCell.click();
  const cellBounding = (await centerCell.boundingBox())!;
  const tableBounding = (await page.locator('#editor4 .ql-table').boundingBox())!;
  expect(cellBounding).not.toBeNull();
  expect(tableBounding).not.toBeNull();

  const colBoundingBox = (await page.locator('#editor4 .table-up-resize-box__col-separator').nth(2).boundingBox())!;
  expect(colBoundingBox).not.toBeNull();
  await page.mouse.move(colBoundingBox.x + colBoundingBox.width - 4, colBoundingBox.y + 4);
  await page.mouse.down();
  await page.mouse.move(colBoundingBox.x + colBoundingBox.width - 4 - tableBounding.width, colBoundingBox.y);
  await page.mouse.up();
  await page.waitForTimeout(1000);
  const cols = page.locator('#editor4 .ql-table-wrapper col');
  const colCount = await cols.count();
  let width = 0;
  for (let i = 0; i < colCount; i++) {
    width += Number.parseFloat((await cols.nth(i).getAttribute('width'))!);
  }
  expect(width).toBeCloseTo(100, 2);
});

extendTest.describe('TableResizeScale functional', () => {
  extendTest('test TableResizeScale functional', async ({ page }) => {
    await createTableBySelect(page, 'container1', 3, 3);
    const centerCell = page.locator('#editor1').getByRole('cell').nth(4);
    await centerCell.click();
    const cellBounding = (await centerCell.boundingBox())!;
    const scaleBtnBounding = (await page.locator('#editor1 .table-up-scale__block').boundingBox())!;
    expect(cellBounding).not.toBeNull();
    expect(scaleBtnBounding).not.toBeNull();
    await page.mouse.move(scaleBtnBounding.x + scaleBtnBounding.width / 2, scaleBtnBounding.y + scaleBtnBounding.height / 2);
    await page.mouse.down();
    await page.mouse.move(scaleBtnBounding.x + scaleBtnBounding.width / 2 - 90, scaleBtnBounding.y + scaleBtnBounding.height / 2 + 90);
    await page.mouse.up();
    const cols = page.locator('#editor1 .ql-table-wrapper col');
    for (const col of await cols.all()) {
      await expect(col).toHaveAttribute('width', `${Math.floor(cellBounding.width - 30)}px`);
    }

    const cells = page.locator('#editor1 .ql-table-wrapper td');
    for (const cell of await cells.all()) {
      await expect(cell).toHaveCSS('height', `${Math.floor(cellBounding.height + 30)}px`);
    }
  });

  extendTest('test TableResizeBox and TableResizeScale should update when text change', async ({ page, editorPage }) => {
    editorPage.index = 1;
    await createTableBySelect(page, 'container2', 3, 3);

    const lineBound = (await page.locator('#editor2 .ql-editor > p').first().boundingBox())!;
    expect(lineBound).not.toBeNull();
    await page.locator('#editor2 .ql-table .ql-table-cell').nth(0).click();
    const scale = page.locator('#container2 .table-up-scale');
    const boxTop = await page.locator('#container2 .table-up-resize-box').evaluate((element) => {
      return Number.parseFloat(window.getComputedStyle(element).top);
    });
    const scaleTop = await scale.evaluate((element) => {
      return Number.parseFloat(window.getComputedStyle(element).top);
    });
    await expect(scale).toBeVisible();
    await expect(page.locator('#container2 .table-up-resize-box .table-up-resize-box__corner')).toBeVisible();

    await editorPage.updateContents([{ insert: '12345\n12345\n12345' }], 'user');
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });

    await expect(scale).toBeVisible();
    await expect(page.locator('#container2 .table-up-resize-box .table-up-resize-box__corner')).toBeVisible();
    const newScaleTop = await scale.evaluate((element) => {
      return Number.parseFloat(window.getComputedStyle(element).top);
    });
    expect(newScaleTop).toBeCloseTo(scaleTop + lineBound.height * 2, 4);
    const newBoxTop = await page.locator('#container2 .table-up-resize-box').evaluate((element) => {
      return Number.parseFloat(window.getComputedStyle(element).top);
    });
    expect(newBoxTop).toBeCloseTo(boxTop + lineBound.height * 2, 4);
  });

  extendTest('test TableResizeScale should hide when table width switch full', async ({ page }) => {
    await createTableBySelect(page, 'container1', 3, 3);

    const cell = page.locator('#editor1 .ql-editor .ql-table td').nth(0);
    await cell.click();
    await expect(page.locator('#container1 .table-up-scale')).toBeVisible();

    await cell.click({ button: 'right' });
    await page.locator('.table-up-menu.is-contextmenu .table-up-menu__item').filter({ hasText: 'Switch table width' }).first().click();
    await expect(page.locator('#container1 .table-up-scale')).not.toBeVisible();
  });

  extendTest('TableResizeScale block should scroll with table wrapper', async ({ page, editorPage }) => {
    editorPage.index = 0;
    await editorPage.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', width: 500 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', width: 500 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '3', width: 500 } } },
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

    const cell = page.locator('#container1 .ql-editor .ql-table td').nth(0);
    await cell.click();

    const scaleWrapper = page.locator('#container1 .table-up-scale');
    const block = page.locator('#container1 .table-up-scale .table-up-scale__block');
    await expect(block).toBeVisible();
    const scaleWrapperBounding = (await scaleWrapper.boundingBox())!;
    const blockBounding = (await block.boundingBox())!;
    expect(scaleWrapperBounding).not.toBeNull();
    expect(blockBounding).not.toBeNull();
    expect(blockBounding.x + blockBounding.width).toBeGreaterThan(scaleWrapperBounding.x + scaleWrapperBounding.width);

    await page.locator('#editor1 .ql-table-wrapper').evaluate((el) => {
      el.scrollLeft = el.scrollWidth;
    });
    // Wait for scroll to complete
    await page.waitForTimeout(100);
    const scrollBlockBounding = (await block.boundingBox())!;
    expect(scrollBlockBounding.x + scrollBlockBounding.width).toBeLessThanOrEqual(scaleWrapperBounding.x + scaleWrapperBounding.width + 1); // Add 1px tolerance for floating point precision
  });
});

extendTest('test TableResizeBox head click and shift click (column)', async ({ page }) => {
  await createTableBySelect(page, 'container2', 3, 3);

  const firstCell = page.locator('#editor2').getByRole('cell').nth(0);
  await firstCell.click();
  expect(page.locator('#editor2 .table-up-resize-box .table-up-resize-box__corner')).toBeVisible();

  await page.locator('#editor2 .table-up-resize-box__col-header').nth(0).click();
  const selection = page.locator('#editor2 .table-up-selection .table-up-selection__line');
  const selectionBounding = (await selection.boundingBox())!;
  expect(selectionBounding).not.toBeNull();

  const tableBounding = (await page.locator('#editor2 .ql-table').boundingBox())!;
  expect(tableBounding).not.toBeNull();
  // minus beacuse `border-collapse: collapse;`
  expect(selectionBounding.height).toBe(tableBounding.height - 1);

  await page.keyboard.down('Shift');
  await page.locator('#editor2 .table-up-resize-box__col-header').nth(2).click();

  const selectionBounding2 = (await selection.boundingBox())!;
  expect(selectionBounding2).not.toBeNull();
  expect(selectionBounding2.height).toBe(tableBounding.height - 1);
  expect(selectionBounding2.width).toBe(tableBounding.width - 1);
});

extendTest('test TableResizeBox head click and shift click (row)', async ({ page }) => {
  await createTableBySelect(page, 'container2', 3, 3);

  const firstCell = page.locator('#editor2').getByRole('cell').nth(0);
  await firstCell.click();
  expect(page.locator('#editor2 .table-up-resize-box .table-up-resize-box__corner')).toBeVisible();

  await page.locator('#editor2 .table-up-resize-box__row-header').nth(0).click();
  const selection = page.locator('#editor2 .table-up-selection .table-up-selection__line');
  const selectionBounding = (await selection.boundingBox())!;
  expect(selectionBounding).not.toBeNull();

  const tableBounding = (await page.locator('#editor2 .ql-table').boundingBox())!;
  expect(tableBounding).not.toBeNull();
  // minus beacuse `border-collapse: collapse;`
  expect(selectionBounding.width).toBe(tableBounding.width - 1);

  await page.keyboard.down('Shift');
  await page.locator('#editor2 .table-up-resize-box__row-header').nth(2).click();

  const selectionBounding2 = (await selection.boundingBox())!;
  expect(selectionBounding2).not.toBeNull();
  expect(selectionBounding2.height).toBe(tableBounding.height - 1);
  expect(selectionBounding2.width).toBe(tableBounding.width - 1);
});

extendTest('test TableResizeBox head click and shift click (row mixin column)', async ({ page }) => {
  await createTableBySelect(page, 'container2', 3, 3);
  const firstCell = page.locator('#editor2').getByRole('cell').nth(0);
  await firstCell.click();
  expect(page.locator('#editor2 .table-up-resize-box .table-up-resize-box__corner')).toBeVisible();

  await page.locator('#editor2 .table-up-resize-box__row-header').nth(1).click();
  await page.keyboard.down('Shift');
  await page.locator('#editor2 .table-up-resize-box__col-header').nth(1).click();

  const selectionBounding = (await page.locator('#editor2 .table-up-selection .table-up-selection__line').boundingBox())!;
  expect(selectionBounding).not.toBeNull();
  const cellBounding = (await page.locator('#editor2 .ql-editor .ql-table td').nth(0).boundingBox())!;
  expect(cellBounding).not.toBeNull();
  expect(selectionBounding.height).toBe(cellBounding.height * 2);
  expect(selectionBounding.width).toBe(cellBounding.width * 2);
});

extendTest('test TableResizeBox head click and shift click (scroll table wrapper)', async ({ page, editorPage }) => {
  editorPage.index = 1;
  editorPage.setContents([
    { insert: '\n' },
    { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 500 } } },
    { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 500 } } },
    { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 500 } } },
    { insert: { 'table-up-col': { tableId: '1', colId: '4', full: false, width: 500 } } },
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

  const firstCell = page.locator('#editor2').getByRole('cell').nth(0);
  await firstCell.click();
  expect(page.locator('#editor2 .table-up-resize-box .table-up-resize-box__corner')).toBeVisible();
  await page.locator('#editor2 .ql-table-wrapper').evaluate((el) => {
    el.scrollLeft = el.scrollWidth;
  });

  await page.locator('#editor2 .table-up-resize-box__col-header').nth(2).click();
  await page.locator('#editor2 .ql-table-wrapper').evaluate((el) => {
    el.scrollLeft = 0;
  });
  await page.keyboard.down('Shift');
  await page.locator('#editor2 .table-up-resize-box__col-header').nth(0).click();

  const selectionBounding = (await page.locator('#editor2 .table-up-selection .table-up-selection__line').boundingBox())!;
  const cellBounding = (await page.locator('#editor2 .ql-editor .ql-table td').nth(0).boundingBox())!;
  expect(cellBounding).not.toBeNull();
  expect(selectionBounding.width).toBe(cellBounding.width * 3);
});

extendTest.describe('TableResizeBox drag content', () => {
  extendTest('drag column', async ({ page, editorPage }) => {
    editorPage.index = 1;
    await editorPage.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', width: 300 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', width: 300 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '3', width: 300 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '4', width: 300 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '5', width: 300 } } },
      { insert: '1' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '2' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '3' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '4' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '4', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '5' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '5', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '6' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '7' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '8' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '9' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '4', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '10' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '5', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '11' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '12' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '13' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '14' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '4', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '15' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '5', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '16' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '17' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '18' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '19' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '4', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '20' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '5', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '21' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '22' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '23' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '24' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '4', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '25' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '5', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);

    await page.locator('td').nth(0).click();
    expect(await page.locator('#container2 .table-up-toolbox .table-up-resize-box__col').isVisible()).toBe(true);
    await page.locator('#container2 .table-up-toolbox .table-up-resize-box__col-header').nth(0).click();
    const headBoundingBox = (await page.locator('#container2 .table-up-toolbox .table-up-resize-box__col-header').nth(0).boundingBox())!;
    expect(headBoundingBox).not.toBeNull();

    await page.mouse.move(headBoundingBox.x + headBoundingBox.width / 2, headBoundingBox.y + headBoundingBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(headBoundingBox.x + headBoundingBox.width * 3, headBoundingBox.y + headBoundingBox.height / 2);
    await page.mouse.up();

    const delta = await editorPage.getContents();
    expect(delta.ops).toEqual([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 300 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 300 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 300 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '4', full: false, width: 300 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '5', full: false, width: 300 } } },
      { insert: '2' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '3' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '1' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '4' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '4', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '5' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '5', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '7' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '8' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '6' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '9' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '4', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '10' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '5', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '12' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '13' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '11' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '14' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '4', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '15' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '5', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '17' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '18' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '16' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '19' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '4', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '20' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '5', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '22' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '23' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '21' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '24' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '4', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '25' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '5', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '\n' },
    ]);
  });

  extendTest('drag multiple column', async ({ page, editorPage }) => {
    editorPage.index = 1;
    await editorPage.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', width: 300 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', width: 300 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '3', width: 300 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '4', width: 300 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '5', width: 300 } } },
      { insert: '1' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '2' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '3' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '4' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '4', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '5' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '5', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '6' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '7' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '8' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '9' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '4', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '10' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '5', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '11' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '12' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '13' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '14' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '4', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '15' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '5', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '16' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '17' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '18' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '19' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '4', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '20' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '5', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '21' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '22' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '23' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '24' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '4', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '25' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '5', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);

    await page.locator('td').nth(0).click();
    expect(await page.locator('#container2 .table-up-toolbox .table-up-resize-box__col').isVisible()).toBe(true);
    await page.locator('#container2 .table-up-toolbox .table-up-resize-box__col-header').nth(0).click();
    await page.keyboard.down('Shift');
    await page.locator('#container2 .table-up-toolbox .table-up-resize-box__col-header').nth(2).click();
    await page.keyboard.up('Shift');

    const headBoundingBox = (await page.locator('#container2 .table-up-toolbox .table-up-resize-box__col-header').nth(2).boundingBox())!;
    expect(headBoundingBox).not.toBeNull();

    await page.mouse.move(headBoundingBox.x + headBoundingBox.width / 2, headBoundingBox.y + headBoundingBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(headBoundingBox.x + headBoundingBox.width * 2, headBoundingBox.y + headBoundingBox.height / 2);
    // wait scroll wrapper
    await page.waitForTimeout(1000);
    // trigger mousemove to calculate the position
    await page.mouse.move(headBoundingBox.x + headBoundingBox.width * 2, headBoundingBox.y + headBoundingBox.height / 2);
    await page.mouse.up();

    const delta = await editorPage.getContents();
    expect(delta.ops).toEqual([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '4', full: false, width: 300 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '5', full: false, width: 300 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 300 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 300 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 300 } } },
      { insert: '4' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '4', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '5' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '5', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '1' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '2' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '3' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '9' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '4', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '10' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '5', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '6' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '7' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '8' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '14' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '4', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '15' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '5', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '11' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '12' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '13' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '19' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '4', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '20' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '5', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '16' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '17' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '18' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '24' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '4', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '25' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '5', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '21' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '22' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '23' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '\n' },
    ]);
  });

  extendTest('drag row', async ({ page, editorPage }) => {
    editorPage.index = 1;
    await editorPage.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', width: 300 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', width: 300 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '3', width: 300 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '4', width: 300 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '5', width: 300 } } },
      { insert: '1' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '2' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '3' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '4' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '4', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '5' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '5', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '6' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '7' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '8' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '9' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '4', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '10' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '5', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '11' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '12' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '13' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '14' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '4', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '15' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '5', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '16' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '17' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '18' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '19' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '4', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '20' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '5', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '21' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '22' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '23' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '24' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '4', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '25' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '5', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);

    await page.locator('td').nth(0).click();
    expect(await page.locator('#container2 .table-up-toolbox .table-up-resize-box__row').isVisible()).toBe(true);
    await page.locator('#container2 .table-up-toolbox .table-up-resize-box__row-header').nth(0).click();
    const headBoundingBox = (await page.locator('#container2 .table-up-toolbox .table-up-resize-box__row-header').nth(0).boundingBox())!;
    expect(headBoundingBox).not.toBeNull();

    await page.mouse.move(headBoundingBox.x + headBoundingBox.width / 2, headBoundingBox.y + headBoundingBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(headBoundingBox.x + headBoundingBox.width / 2, headBoundingBox.y + headBoundingBox.height * 3);
    await page.mouse.up();

    const delta = await editorPage.getContents();
    expect(delta.ops).toEqual([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 300 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 300 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 300 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '4', full: false, width: 300 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '5', full: false, width: 300 } } },
      { insert: '6' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '7' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '8' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '9' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '4', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '10' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '5', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '11' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '12' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '13' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '14' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '4', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '15' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '5', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '1' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '2' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '3' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '4' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '4', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '5' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '5', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '16' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '17' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '18' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '19' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '4', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '20' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '5', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '21' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '22' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '23' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '24' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '4', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '25' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '5', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '\n' },
    ]);
  });

  extendTest('drag multiple row', async ({ page, editorPage }) => {
    editorPage.index = 1;
    await editorPage.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', width: 300 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', width: 300 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '3', width: 300 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '4', width: 300 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '5', width: 300 } } },
      { insert: '1' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '2' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '3' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '4' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '4', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '5' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '5', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '6' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '7' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '8' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '9' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '4', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '10' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '5', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '11' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '12' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '13' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '14' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '4', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '15' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '5', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '16' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '17' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '18' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '19' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '4', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '20' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '5', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '21' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '22' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '23' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '24' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '4', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '25' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '5', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);

    await page.locator('td').nth(0).click();
    expect(await page.locator('#container2 .table-up-toolbox .table-up-resize-box__row').isVisible()).toBe(true);
    await page.locator('#container2 .table-up-toolbox .table-up-resize-box__row-header').nth(0).click();
    await page.keyboard.down('Shift');
    await page.locator('#container2 .table-up-toolbox .table-up-resize-box__row-header').nth(2).click();
    await page.keyboard.up('Shift');

    const headBoundingBox = (await page.locator('#container2 .table-up-toolbox .table-up-resize-box__row-header').nth(2).boundingBox())!;
    expect(headBoundingBox).not.toBeNull();

    await page.mouse.move(headBoundingBox.x + headBoundingBox.width / 2, headBoundingBox.y + headBoundingBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(headBoundingBox.x + headBoundingBox.width / 2, headBoundingBox.y + headBoundingBox.height * 3);
    await page.mouse.up();

    const delta = await editorPage.getContents();
    expect(delta.ops).toEqual([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 300 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 300 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 300 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '4', full: false, width: 300 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '5', full: false, width: 300 } } },
      { insert: '16' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '17' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '18' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '19' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '4', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '20' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '5', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '21' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '22' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '23' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '24' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '4', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '25' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '5', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '1' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '2' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '3' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '4' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '4', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '5' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '5', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '6' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '7' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '8' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '9' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '4', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '10' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '5', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '11' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '12' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '13' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '14' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '4', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '15' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '5', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '\n' },
    ]);
  });

  extendTest('drag include emptyRow', async ({ page, editorPage }) => {
    editorPage.index = 5;
    editorPage.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 211 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 211 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 211 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '4', full: false, width: 211 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '5', full: false, width: 211 } } },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '4', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '5', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '4', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '5', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 3, colspan: 5, tag: 'td', wrapTag: 'tbody', emptyRow: ['4', '5'] } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '6', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '6', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '6', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '6', colId: '4', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '6', colId: '5', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '7', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '7', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '7', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '7', colId: '4', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '7', colId: '5', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '\n' },
    ]);

    await page.locator('td').nth(0).click();
    expect(await page.locator('#container6 .table-up-toolbox .table-up-resize-box__row').isVisible()).toBe(true);
    await page.locator('#container6 .table-up-toolbox .table-up-resize-box__row-header').nth(1).click();
    await page.keyboard.down('Shift');
    await page.locator('#container6 .table-up-toolbox .table-up-resize-box__row-header').nth(3).click();
    await page.keyboard.up('Shift');

    const headBoundingBox = (await page.locator('#container6 .table-up-toolbox .table-up-resize-box__row-header').nth(3).boundingBox())!;
    expect(headBoundingBox).not.toBeNull();

    await page.mouse.move(headBoundingBox.x + headBoundingBox.width / 2, headBoundingBox.y + headBoundingBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(headBoundingBox.x + headBoundingBox.width / 2, headBoundingBox.y + headBoundingBox.height * 2);
    await page.mouse.up();

    const delta = await editorPage.getContents();
    expect(delta.ops).toEqual([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 211 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 211 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 211 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '4', full: false, width: 211 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '5', full: false, width: 211 } } },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '4', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '5', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '7', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '7', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '7', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '7', colId: '4', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '7', colId: '5', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '4', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '5', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 3, colspan: 5, tag: 'td', wrapTag: 'tbody', emptyRow: ['4', '5'] } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '6', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '6', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '6', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '6', colId: '4', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '6', colId: '5', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '\n' },
    ]);
  });
});

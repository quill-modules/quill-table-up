import type { TableCellInnerFormat } from '../../formats';
import type { TableSelection } from '../../modules';
import type { TableUp } from '../../table-up';
import { expect, test } from '@playwright/test';
import { createTableBySelect, extendTest, pasteHTML } from './utils';

test.beforeEach(async ({ page }) => {
  await page.goto('http://127.0.0.1:5500/docs/test.html');
  page.locator('.ql-container.ql-snow');
});

extendTest.describe('table cell keyboard handler enter', () => {
  extendTest('cursor at the start of BlockEmbed', async ({ page, editorPage }) => {
    editorPage.index = 0;
    await editorPage.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: true, width: 100 } } },
      { insert: { video: 'https://quilljs.com/' } },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);
    await page.waitForTimeout(1000);

    await editorPage.setSelection(2, 0);
    await page.keyboard.press('Enter');
    await expect(page.locator('#editor1 .ql-table-wrapper .ql-table-cell-inner iframe').nth(0)).toBeVisible();
    await expect(page.locator('#editor1 .ql-table-wrapper .ql-table-cell-inner p').nth(0)).toBeVisible();
    const delta = await editorPage.getContents();
    const contents = [
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: true, width: 100 } } },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: { video: 'https://quilljs.com/' } },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '\n' },
    ];
    for (const [i, op] of delta.ops.entries()) {
      expect(op).toStrictEqual(contents[i]);
    }
  });

  extendTest('cursor at the end of BlockEmbed', async ({ page, editorPage }) => {
    editorPage.index = 0;
    await editorPage.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: true, width: 100 } } },
      { insert: { video: 'https://quilljs.com/' } },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);
    await page.waitForTimeout(1000);

    await editorPage.setSelection(3, 0);
    await page.keyboard.press('Enter');
    await expect(page.locator('#editor1 .ql-table-wrapper .ql-table-cell-inner p').nth(0)).toBeVisible();
    await expect(page.locator('#editor1 .ql-table-wrapper .ql-table-cell-inner iframe').nth(0)).toBeVisible();
    const delta = await editorPage.getContents();
    const contents = [
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: true, width: 100 } } },
      { insert: { video: 'https://quilljs.com/' } },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n\n' },
      { insert: '\n' },
    ];
    for (const [i, op] of delta.ops.entries()) {
      expect(op).toStrictEqual(contents[i]);
    }
  });

  extendTest('selection multiple line', async ({ page, editorPage }) => {
    editorPage.index = 0;
    await editorPage.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: true, width: 100 } } },
      { insert: { video: 'https://quilljs.com/' } },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '123' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '123' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
    ]);
    await page.waitForTimeout(1000);

    await editorPage.setSelection(4, 7);
    await page.keyboard.press('Enter');
    await expect(page.locator('#editor1 .ql-table-wrapper .ql-table-cell-inner p')).toHaveCount(2);
  });
});

extendTest.describe('table cell keyboard handler ArrowUp and ArrowDown', () => {
  extendTest('test TableSelection should update when selection change', async ({ page, editorPage }) => {
    editorPage.index = 0;
    await createTableBySelect(page, 'container1', 3, 3);

    await page.locator('#editor1 .ql-table .ql-table-cell').nth(0).click();
    const selectionLine = page.locator('#container1 .table-up-selection .table-up-selection__line');
    await expect(selectionLine).toBeVisible();

    await page.keyboard.press('ArrowRight');
    await expect(selectionLine).toBeVisible();
    const newSelectionWrapper = (await selectionLine.boundingBox())!;
    expect(newSelectionWrapper).not.toBeNull();
    const cell1Bound = (await page.locator('#editor1 .ql-editor td').nth(1).boundingBox())!;
    expect(cell1Bound).not.toBeNull();
    expect(cell1Bound).toEqual(newSelectionWrapper);
  });

  extendTest('test TableSelection and TableMenuSelect should hide when selection out table', async ({ page }) => {
    await createTableBySelect(page, 'container1', 3, 3);
    const firstCell1 = page.locator('#editor1').getByRole('cell').nth(0);
    await firstCell1.click();
    expect(page.locator('#container1 .table-up-selection')).toBeVisible();

    await page.keyboard.down('ArrowUp');
    expect(page.locator('#container1 .table-up-selection')).not.toBeVisible();

    await firstCell1.click();
    await firstCell1.click({ button: 'right' });
    await expect(page.locator('#container1 .table-up-selection')).toBeVisible();
    await expect(page.locator('.table-up-menu.is-contextmenu')).toBeVisible();

    await page.keyboard.down('ArrowUp');
    await expect(page.locator('#container1 .table-up-selection')).not.toBeVisible();
    await expect(page.locator('.table-up-menu.is-contextmenu')).not.toBeVisible();

    await createTableBySelect(page, 'container2', 3, 3);
    const firstCell2 = page.locator('#editor2').getByRole('cell').nth(0);
    await firstCell2.click();
    await expect(page.locator('#container2 .table-up-selection')).toBeVisible();

    await page.keyboard.down('ArrowUp');
    await expect(page.locator('#container2 .table-up-selection')).not.toBeVisible();

    await firstCell2.click();
    await expect(page.locator('#container2 .table-up-selection')).toBeVisible();
    await expect(page.locator('#container2 .table-up-menu')).toBeVisible();

    await page.keyboard.down('ArrowUp');
    await expect(page.locator('#container2 .table-up-selection')).not.toBeVisible();
    await expect(page.locator('#container2 .table-up-menu')).not.toBeVisible();
  });

  extendTest('test table keyboard ArrowUp and ArrowDown should work', async ({ page, editorPage }) => {
    editorPage.index = 0;
    editorPage.setContents([
      { insert: '123456\n' },
      { insert: { 'table-up-col': { tableId: 'njo6syk0zqb', colId: 'mnpytyt1cno', full: false, width: 291 } } },
      { insert: { 'table-up-col': { tableId: 'njo6syk0zqb', colId: '6ihx044tflt', full: false, width: 291 } } },
      { insert: { 'table-up-col': { tableId: 'njo6syk0zqb', colId: 'raiomwr9yuc', full: false, width: 291 } } },
      { insert: { 'table-up-col': { tableId: 'njo6syk0zqb', colId: 'qiuz7k09q6r', full: false, width: 291 } } },
      { insert: '123' },
      { attributes: { 'table-up-cell-inner': { tableId: 'njo6syk0zqb', rowId: 'rvwpsb2pky', colId: 'mnpytyt1cno', rowspan: 2, colspan: 2 } }, insert: '\n' },
      { insert: '123456' },
      { attributes: { 'table-up-cell-inner': { tableId: 'njo6syk0zqb', rowId: 'rvwpsb2pky', colId: 'mnpytyt1cno', rowspan: 2, colspan: 2 } }, insert: '\n' },
      { insert: '123' },
      { attributes: { 'table-up-cell-inner': { tableId: 'njo6syk0zqb', rowId: 'rvwpsb2pky', colId: 'mnpytyt1cno', rowspan: 2, colspan: 2 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'njo6syk0zqb', rowId: 'rvwpsb2pky', colId: 'raiomwr9yuc', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'njo6syk0zqb', rowId: 'rvwpsb2pky', colId: 'qiuz7k09q6r', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '123' },
      { attributes: { 'table-up-cell-inner': { tableId: 'njo6syk0zqb', rowId: 'vhg5x933cs', colId: 'raiomwr9yuc', rowspan: 1, colspan: 2 } }, insert: '\n' },
      { insert: '123456' },
      { attributes: { 'table-up-cell-inner': { tableId: 'njo6syk0zqb', rowId: 'vhg5x933cs', colId: 'raiomwr9yuc', rowspan: 1, colspan: 2 } }, insert: '\n' },
      { insert: '123' },
      { attributes: { 'table-up-cell-inner': { tableId: 'njo6syk0zqb', rowId: 'vhg5x933cs', colId: 'raiomwr9yuc', rowspan: 1, colspan: 2 } }, insert: '\n' },
      { insert: '12345' },
      { attributes: { 'table-up-cell-inner': { tableId: 'njo6syk0zqb', rowId: 'nsb7mrygbk9', colId: 'mnpytyt1cno', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'njo6syk0zqb', rowId: 'nsb7mrygbk9', colId: '6ihx044tflt', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'njo6syk0zqb', rowId: 'nsb7mrygbk9', colId: 'raiomwr9yuc', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'njo6syk0zqb', rowId: 'nsb7mrygbk9', colId: 'qiuz7k09q6r', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '123456\n' },
    ]);

    await editorPage.setSelection(50, 0);
    await page.keyboard.press('ArrowUp');
    expect((await editorPage.getSelection())!.index).toBe(39);

    await editorPage.setSelection(48, 0);
    await page.keyboard.press('ArrowUp');
    expect((await editorPage.getSelection())!.index).toBe(25);

    await editorPage.setSelection(14, 0);
    await page.keyboard.press('ArrowUp');
    expect((await editorPage.getSelection())!.index).toBe(6);

    await editorPage.setSelection(25, 0);
    await page.keyboard.press('ArrowDown');
    expect((await editorPage.getSelection())!.index).toBe(46);

    await editorPage.setSelection(26, 0);
    await page.keyboard.press('ArrowDown');
    expect((await editorPage.getSelection())!.index).toBe(28);

    await editorPage.setSelection(48, 0);
    await page.keyboard.press('ArrowDown');
    expect((await editorPage.getSelection())!.index).toBe(52);

    await editorPage.setSelection(50, 0);
    await page.keyboard.press('ArrowDown');
    expect((await editorPage.getSelection())!.index).toBe(52);
  });

  extendTest('test TableSelection should update when selection change and menu display', async ({ page, editorPage }) => {
    editorPage.index = 0;
    await createTableBySelect(page, 'container1', 3, 3);

    await page.locator('#editor1 .ql-table .ql-table-cell').nth(0).click();
    const selectionLine = page.locator('#container1 .table-up-selection .table-up-selection__line');
    await expect(selectionLine).toBeVisible();

    await page.locator('#editor1 .ql-table .ql-table-cell').nth(0).click({ button: 'right' });
    await expect(page.locator('.table-up-menu.is-contextmenu')).toBeVisible();

    await page.locator('.table-up-menu.is-contextmenu .table-up-menu__item').filter({ hasText: 'Set background color' }).first().click();
    await page.waitForTimeout(1000);
    await expect(selectionLine).not.toBeVisible();

    await page.keyboard.press('ArrowDown');
    await expect(selectionLine).not.toBeVisible();
    await expect(page.locator('.table-up-menu.is-contextmenu')).toBeVisible();
  });
});

extendTest.describe('TableSelection keyboard handler', () => {
  extendTest('backspace should not remove cell content when focus element not in editor', async ({ page, editorPage }) => {
    editorPage.index = 0;
    await editorPage.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 121 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 121 } } },
      { attributes: { link: 'www.any.link' }, insert: 'some text' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td' } }, insert: '\n' },
      { insert: '2' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1, tag: 'td' } }, insert: '\n' },
      { insert: '4' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1, tag: 'td' } }, insert: '\n' },
      { insert: '5' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1, tag: 'td' } }, insert: '\n' },
      { insert: '\n' },
    ]);
    await page.waitForTimeout(1000);

    await page.locator('#editor1 .ql-table-wrapper .ql-table-cell-inner p').nth(0).click();
    await page.locator('#editor1 .ql-tooltip .ql-action').click();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Backspace');

    expect(await page.locator('#editor1 .ql-tooltip input').nth(0).inputValue()).toBe('www.any.lin');
    expect(await page.locator('#editor1 .ql-table-wrapper .ql-table-cell-inner p').nth(0).textContent()).toBe('some text');
  });

  extendTest('should handle delete table cell text when selected tds', async ({ page, editorPage }) => {
    editorPage.index = 0;
    await editorPage.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 121 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 121 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 121 } } },
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

    await expect(page.locator('#editor1 .ql-table .ql-table-cell').nth(0)).toHaveText('1');
    await expect(page.locator('#editor1 .ql-table .ql-table-cell').nth(1)).toHaveText('2');

    const cell1 = page.locator('#editor1 .ql-editor .ql-table td').nth(0);
    const cell1Bounding = (await cell1.boundingBox())!;
    expect(cell1Bounding).not.toBeNull();
    await cell1.click();
    const selectionLine = page.locator('#container1 .table-up-selection .table-up-selection__line');
    await expect(selectionLine).toBeVisible();

    await page.mouse.down();
    await page.mouse.move(cell1Bounding.x + cell1Bounding.width * 1.5, cell1Bounding.y + cell1Bounding.height / 2);
    await page.mouse.up();
    await editorPage.blur();
    await page.dispatchEvent('#editor1 .ql-editor', 'keydown', {
      key: 'Backspace',
      code: 'Backspace',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true,
    });

    await expect(page.locator('#editor1 .ql-table .ql-table-cell').nth(0)).toHaveText('');
    await expect(page.locator('#editor1 .ql-table .ql-table-cell').nth(1)).toHaveText('');

    const cell8 = page.locator('#editor1 .ql-editor .ql-table td').nth(8);
    const cell8Bounding = (await cell8.boundingBox())!;
    expect(cell8Bounding).not.toBeNull();
    await cell8.click();
    await page.mouse.down();
    await page.mouse.move(cell8Bounding.x - cell8Bounding.width * 0.5, cell8Bounding.y + cell8Bounding.height / 2);
    await page.mouse.up();
    await editorPage.blur();
    await page.dispatchEvent('#editor1 .ql-editor', 'keydown', {
      key: 'Backspace',
      code: 'Backspace',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true,
    });

    await expect(page.locator('#editor1 .ql-table .ql-table-cell').nth(8)).toHaveText('');
    await expect(page.locator('#editor1 .ql-table .ql-table-cell').nth(7)).toHaveText('');
  });

  extendTest('should delete table when selected all cells and press delete', async ({ page, editorPage }) => {
    editorPage.index = 0;
    await editorPage.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 121 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 121 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 121 } } },
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
    const cell1 = page.locator('#editor1 .ql-editor .ql-table td').nth(0);
    const cell1Bounding = (await cell1.boundingBox())!;
    expect(cell1Bounding).not.toBeNull();
    await cell1.click();
    const selectionLine = page.locator('#container1 .table-up-selection .table-up-selection__line');
    await expect(selectionLine).toBeVisible();

    await page.mouse.down();
    await page.mouse.move(cell1Bounding.x + cell1Bounding.width * 2.5, cell1Bounding.y + cell1Bounding.height * 2.5);
    await page.mouse.up();
    await editorPage.blur();
    await page.dispatchEvent('#editor1 .ql-editor', 'keydown', {
      key: 'Backspace',
      code: 'Backspace',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true,
    });

    expect(await page.locator('#editor1 .ql-table').count()).toBe(0);
  });

  extendTest('copy cells', async ({ page, editorPage }) => {
    editorPage.page = page;
    editorPage.index = 0;
    await editorPage.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 100 } } },
      { insert: '1' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '2' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '3' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '4' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 2, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '5' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 2, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '6' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '7' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '8' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '9' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '\n' },
    ]);
    const cell1Bound = (await page.locator('#container1 .ql-table-wrapper td').nth(0).boundingBox())!;
    expect(cell1Bound).not.toBeNull();

    await page.locator('#container1 .ql-table-wrapper td').nth(0).click();
    // set table selection
    await page.evaluate(() => {
      const tableUp = window.quills[0].getModule('table-up') as TableUp;
      const tableSelection = tableUp.getModule<TableSelection>('table-selection')!;
      const doms = document.querySelectorAll('#container1 td .ql-table-cell-inner');
      const cells = Array.from(doms).map(dom => window.Quill.find(dom)) as TableCellInnerFormat[];
      tableSelection.setSelectedTds([cells[0], cells[1], cells[3]]);
      tableSelection.updateWithSelectedTds();
    });
    await page.waitForTimeout(1000);

    const tableSelection = page.locator('#container1 .table-up-toolbox .table-up-selection__line');
    await expect(tableSelection).toBeVisible();

    await editorPage.blur();
    await page.keyboard.press('Control+c');

    const cellText = await page.evaluate(() => {
      const tableUp = window.quills[0].getModule('table-up') as TableUp;
      const tds = tableUp.getModule<TableSelection>('table-selection')!.selectedTds;
      return tableUp.getTextByCell(tds);
    });
    const copiedText = await page.evaluate(() => navigator.clipboard.readText());
    expect(copiedText.replaceAll('\r', '')).toEqual(cellText);
  });

  extendTest('paste cells with struct(colspan)', async ({ page, browserName, editorPage }) => {
    editorPage.page = page;
    editorPage.index = 0;
    await createTableBySelect(page, 'container1', 3, 3);

    const newCell1Bound = (await page.locator('#container1 .ql-table-wrapper td').nth(0).boundingBox())!;
    expect(newCell1Bound).not.toBeNull();
    await page.locator('#container1 .ql-table-wrapper td').nth(0).click();
    await page.mouse.move(newCell1Bound.x + newCell1Bound.width * 0.5, newCell1Bound.y + newCell1Bound.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(newCell1Bound.x + newCell1Bound.width * 1.5, newCell1Bound.y + newCell1Bound.height * 1.5);
    await page.mouse.up();

    await editorPage.blur();
    await pasteHTML(page, '<div class="ql-table-wrapper" data-table-id="1" contenteditable="false"><table class="ql-table" data-table-id="1" cellpadding="0" cellspacing="0" style="margin-right: auto; width: 200px;"><colgroup data-table-id="1" contenteditable="false"><col width="100px" data-table-id="1" data-col-id="1"><col width="100px" data-table-id="1" data-col-id="2"></colgroup><tbody data-table-id="1"><tr class="ql-table-row" data-table-id="1" data-row-id="1" data-wrap-tag="tbody"><td class="ql-table-cell" data-table-id="1" data-row-id="1" data-col-id="1" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="1" data-col-id="1" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody"><p>1</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="1" data-col-id="2" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="1" data-col-id="2" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody"><p>2</p></div></td></tr><tr class="ql-table-row" data-table-id="1" data-row-id="2" data-wrap-tag="tbody"><td class="ql-table-cell" data-table-id="1" data-row-id="2" data-col-id="1" data-wrap-tag="tbody" rowspan="1" colspan="2"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="2" data-col-id="1" data-rowspan="1" data-colspan="2" data-tag="td" data-wrap-tag="tbody"><p>4</p><p>5</p></div></td></tr></tbody></table></div>', { browserName });

    const cells = page.locator('#container1 .ql-table-wrapper td');
    await expect(cells.nth(0)).toHaveText('1');
    await expect(cells.nth(1)).toHaveText('2');
    await expect(cells.nth(3)).toHaveText('45');
    await expect(cells.nth(3)).toHaveAttribute('colspan', '2');
  });

  extendTest('paste cells with struct(rowspan)', async ({ page, browserName, editorPage }) => {
    editorPage.page = page;
    editorPage.index = 0;
    await createTableBySelect(page, 'container1', 5, 5);

    const newCell1Bound = (await page.locator('#container1 .ql-table-wrapper td').nth(0).boundingBox())!;
    expect(newCell1Bound).not.toBeNull();
    await page.locator('#container1 .ql-table-wrapper td').nth(0).click();
    await page.mouse.move(newCell1Bound.x + newCell1Bound.width * 0.5, newCell1Bound.y + newCell1Bound.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(newCell1Bound.x + newCell1Bound.width * 2.5, newCell1Bound.y + newCell1Bound.height * 1.5);
    await page.mouse.up();

    await editorPage.blur();
    await pasteHTML(page, '<div class="ql-table-wrapper" data-table-id="1" contenteditable="false"><table class="ql-table" data-table-id="1" cellpadding="0" cellspacing="0" style="margin-right: auto; width: 240px;"><colgroup data-table-id="1" contenteditable="false"><col width="80px" data-table-id="1" data-col-id="1"><col width="80px" data-table-id="1" data-col-id="2"><col width="80px" data-table-id="1" data-col-id="3"></colgroup><tbody data-table-id="1"><tr class="ql-table-row" data-table-id="1" data-row-id="1" data-wrap-tag="tbody"><td class="ql-table-cell" data-table-id="1" data-row-id="1" data-col-id="1" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="1" data-col-id="1" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody"><p>1</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="1" data-col-id="2" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="1" data-col-id="2" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody"><p>2</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="1" data-col-id="3" data-wrap-tag="tbody" rowspan="2" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="1" data-col-id="3" data-rowspan="2" data-colspan="1" data-tag="td" data-wrap-tag="tbody"><p>3</p><p>8</p></div></td></tr><tr class="ql-table-row" data-table-id="1" data-row-id="2" data-wrap-tag="tbody"><td class="ql-table-cell" data-table-id="1" data-row-id="2" data-col-id="1" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="2" data-col-id="1" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody"><p>6</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="2" data-col-id="2" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="2" data-col-id="2" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody"><p>7</p></div></td></tr></tbody></table></div>', { browserName });

    const cells = page.locator('#container1 .ql-table-wrapper td');
    await expect(cells.nth(0)).toHaveText('1');
    await expect(cells.nth(1)).toHaveText('2');
    await expect(cells.nth(2)).toHaveText('38');
    await expect(cells.nth(2)).toHaveAttribute('rowspan', '2');
    await expect(cells.nth(5)).toHaveText('6');
    await expect(cells.nth(6)).toHaveText('7');
  });

  extendTest('paste cells with struct(colspan and rowspan)', async ({ page, browserName, editorPage }) => {
    editorPage.page = page;
    editorPage.index = 0;
    await createTableBySelect(page, 'container1', 5, 5);

    const newCell1Bound = (await page.locator('#container1 .ql-table-wrapper td').nth(0).boundingBox())!;
    expect(newCell1Bound).not.toBeNull();
    await page.locator('#container1 .ql-table-wrapper td').nth(0).click();
    await page.mouse.move(newCell1Bound.x + newCell1Bound.width * 0.5, newCell1Bound.y + newCell1Bound.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(newCell1Bound.x + newCell1Bound.width * 2.5, newCell1Bound.y + newCell1Bound.height * 1.5);
    await page.mouse.up();

    await editorPage.blur();
    await pasteHTML(page, '<div class="ql-table-wrapper" data-table-id="1" contenteditable="false"><table class="ql-table" data-table-id="1" cellpadding="0" cellspacing="0" style="margin-right: auto; width: 363px;"><colgroup data-table-id="1" contenteditable="false"><col width="121px" data-table-id="1" data-col-id="1"><col width="121px" data-table-id="1" data-col-id="2"><col width="121px" data-table-id="1" data-col-id="3"></colgroup><tbody data-table-id="1"><tr class="ql-table-row" data-table-id="1" data-row-id="2" data-wrap-tag="tbody"><td class="ql-table-cell" data-table-id="1" data-row-id="2" data-col-id="1" data-wrap-tag="tbody" rowspan="1" colspan="2"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="2" data-col-id="1" data-rowspan="1" data-colspan="2" data-tag="td" data-wrap-tag="tbody"><p>4</p><p>5</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="2" data-col-id="3" data-wrap-tag="tbody" rowspan="2" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="2" data-col-id="3" data-rowspan="2" data-colspan="1" data-tag="td" data-wrap-tag="tbody"><p>6</p><p>9</p></div></td></tr><tr class="ql-table-row" data-table-id="1" data-row-id="3" data-wrap-tag="tbody"><td class="ql-table-cell" data-table-id="1" data-row-id="3" data-col-id="1" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="3" data-col-id="1" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody"><p>7</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="3" data-col-id="2" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="3" data-col-id="2" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody"><p>8</p></div></td></tr></tbody></table></div>', { browserName });

    const cells = page.locator('#container1 .ql-table-wrapper td');
    await expect(cells.nth(0)).toHaveText('45');
    await expect(cells.nth(0)).toHaveAttribute('colspan', '2');
    await expect(cells.nth(1)).toHaveText('69');
    await expect(cells.nth(1)).toHaveAttribute('rowspan', '2');
    await expect(cells.nth(4)).toHaveText('7');
    await expect(cells.nth(5)).toHaveText('8');
  });

  extendTest('paste cells with `emptyRow` in `autoMerge` true', async ({ page, browserName, editorPage }) => {
    editorPage.page = page;
    editorPage.index = 0;
    await createTableBySelect(page, 'container1', 5, 5);

    const newCell1Bound = (await page.locator('#container1 .ql-table-wrapper td').nth(0).boundingBox())!;
    expect(newCell1Bound).not.toBeNull();
    await page.locator('#container1 .ql-table-wrapper td').nth(0).click();
    await page.mouse.move(newCell1Bound.x + newCell1Bound.width * 0.5, newCell1Bound.y + newCell1Bound.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(newCell1Bound.x + newCell1Bound.width * 4.5, newCell1Bound.y + newCell1Bound.height * 2.5);
    await page.mouse.up();
    await editorPage.blur();
    await pasteHTML(page, '<div class="ql-table-wrapper" data-table-id="j89168rvqrd" contenteditable="false"><table class="ql-table" data-table-id="j89168rvqrd" cellpadding="0" cellspacing="0" style="margin-right: auto; width: 730px;"><colgroup data-table-id="j89168rvqrd" contenteditable="false"><col width="146px" data-table-id="j89168rvqrd" data-col-id="i3bpg2i2oy"><col width="146px" data-table-id="j89168rvqrd" data-col-id="lpwv9bfkdxe"><col width="146px" data-table-id="j89168rvqrd" data-col-id="9oopcw7mbfq"><col width="146px" data-table-id="j89168rvqrd" data-col-id="ejdvsjml25"><col width="146px" data-table-id="j89168rvqrd" data-col-id="nialr8ceyks"></colgroup><tbody data-table-id="j89168rvqrd"><tr class="ql-table-row" data-table-id="j89168rvqrd" data-row-id="m8wb3vitcit" data-wrap-tag="tbody"><td class="ql-table-cell" data-table-id="j89168rvqrd" data-row-id="m8wb3vitcit" data-col-id="i3bpg2i2oy" data-wrap-tag="tbody" rowspan="3" colspan="5" data-empty-row="["v4r34a160is","n73z32w0t9l"]"><div class="ql-table-cell-inner" data-table-id="j89168rvqrd" data-row-id="m8wb3vitcit" data-col-id="i3bpg2i2oy" data-rowspan="3" data-colspan="5" data-tag="td" data-wrap-tag="tbody" data-empty-row="["v4r34a160is","n73z32w0t9l"]"><p></p></div></td></tr><tr class="ql-table-row" data-table-id="j89168rvqrd" data-row-id="v4r34a160is" data-wrap-tag="tbody"></tr><tr class="ql-table-row" data-table-id="j89168rvqrd" data-row-id="n73z32w0t9l" data-wrap-tag="tbody"></tr></tbody></table></div>', { browserName });
    const cell1 = page.locator('#container1 .ql-table-wrapper td').nth(0);
    await expect(cell1).not.toHaveAttribute('data-empty-row');
    expect(await page.locator('#container1 .ql-table-wrapper tr').count()).toEqual(3);

    await editorPage.setContents([]);
    await createTableBySelect(page, 'container1', 5, 5);
    const newCell2Bound = (await page.locator('#container1 .ql-table-wrapper td').nth(0).boundingBox())!;
    expect(newCell2Bound).not.toBeNull();
    await page.locator('#container1 .ql-table-wrapper td').nth(0).click();
    await page.mouse.move(newCell2Bound.x + newCell2Bound.width * 0.5, newCell2Bound.y + newCell2Bound.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(newCell2Bound.x + newCell2Bound.width * 4.5, newCell2Bound.y + newCell2Bound.height * 3.5);
    await page.mouse.up();
    await editorPage.blur();
    await pasteHTML(page, '<div class="ql-table-wrapper" data-table-id="j89168rvqrd" contenteditable="false"><table class="ql-table" data-table-id="j89168rvqrd" cellpadding="0" cellspacing="0" style="margin-right: auto; width: 730px;"><colgroup data-table-id="j89168rvqrd" contenteditable="false"><col width="146px" data-table-id="j89168rvqrd" data-col-id="i3bpg2i2oy"><col width="146px" data-table-id="j89168rvqrd" data-col-id="lpwv9bfkdxe"><col width="146px" data-table-id="j89168rvqrd" data-col-id="9oopcw7mbfq"><col width="146px" data-table-id="j89168rvqrd" data-col-id="ejdvsjml25"><col width="146px" data-table-id="j89168rvqrd" data-col-id="nialr8ceyks"></colgroup><tbody data-table-id="j89168rvqrd"><tr class="ql-table-row" data-table-id="j89168rvqrd" data-row-id="m8wb3vitcit" data-wrap-tag="tbody"><td class="ql-table-cell" data-table-id="j89168rvqrd" data-row-id="m8wb3vitcit" data-col-id="i3bpg2i2oy" data-wrap-tag="tbody" rowspan="3" colspan="5" data-empty-row="[&quot;v4r34a160is&quot;,&quot;n73z32w0t9l&quot;]" style="height: 49px;"><div class="ql-table-cell-inner" data-table-id="j89168rvqrd" data-row-id="m8wb3vitcit" data-col-id="i3bpg2i2oy" data-rowspan="3" data-colspan="5" data-tag="td" data-wrap-tag="tbody" data-empty-row="[&quot;v4r34a160is&quot;,&quot;n73z32w0t9l&quot;]" data-style="height: 49px;"><p></p></div></td></tr><tr class="ql-table-row" data-table-id="j89168rvqrd" data-row-id="v4r34a160is" data-wrap-tag="tbody"></tr><tr class="ql-table-row" data-table-id="j89168rvqrd" data-row-id="n73z32w0t9l" data-wrap-tag="tbody"></tr><tr class="ql-table-row" data-table-id="j89168rvqrd" data-row-id="rfiuu54tyn" data-wrap-tag="tbody"><td class="ql-table-cell" data-table-id="j89168rvqrd" data-row-id="rfiuu54tyn" data-col-id="i3bpg2i2oy" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="j89168rvqrd" data-row-id="rfiuu54tyn" data-col-id="i3bpg2i2oy" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody"><p></p></div></td><td class="ql-table-cell" data-table-id="j89168rvqrd" data-row-id="rfiuu54tyn" data-col-id="lpwv9bfkdxe" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="j89168rvqrd" data-row-id="rfiuu54tyn" data-col-id="lpwv9bfkdxe" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody"><p></p></div></td><td class="ql-table-cell" data-table-id="j89168rvqrd" data-row-id="rfiuu54tyn" data-col-id="9oopcw7mbfq" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="j89168rvqrd" data-row-id="rfiuu54tyn" data-col-id="9oopcw7mbfq" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody"><p></p></div></td><td class="ql-table-cell" data-table-id="j89168rvqrd" data-row-id="rfiuu54tyn" data-col-id="ejdvsjml25" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="j89168rvqrd" data-row-id="rfiuu54tyn" data-col-id="ejdvsjml25" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody"><p></p></div></td><td class="ql-table-cell" data-table-id="j89168rvqrd" data-row-id="rfiuu54tyn" data-col-id="nialr8ceyks" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="j89168rvqrd" data-row-id="rfiuu54tyn" data-col-id="nialr8ceyks" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody"><p></p></div></td></tr></tbody></table></div>', { browserName });
    const cell2 = page.locator('#container1 .ql-table-wrapper td').nth(0);
    await expect(cell2).not.toHaveAttribute('data-empty-row');
    expect(await page.locator('#container1 .ql-table-wrapper tr').count()).toEqual(3);
  });

  extendTest('paste cells with `emptyRow` in `autoMerge` false', async ({ page, browserName, editorPage }) => {
    editorPage.page = page;
    editorPage.index = 4;
    await createTableBySelect(page, 'container5', 5, 5);

    const newCell1Bound = (await page.locator('#container5 .ql-table-wrapper td').nth(0).boundingBox())!;
    expect(newCell1Bound).not.toBeNull();
    await page.locator('#container5 .ql-table-wrapper td').nth(0).click();
    await page.mouse.move(newCell1Bound.x + newCell1Bound.width * 0.5, newCell1Bound.y + newCell1Bound.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(newCell1Bound.x + newCell1Bound.width * 4.5, newCell1Bound.y + newCell1Bound.height * 2.5);
    await page.mouse.up();
    await editorPage.blur();
    await pasteHTML(page, '<div class="ql-table-wrapper" data-table-id="j89168rvqrd" contenteditable="false"><table class="ql-table" data-table-id="j89168rvqrd" cellpadding="0" cellspacing="0" style="margin-right: auto; width: 730px;"><colgroup data-table-id="j89168rvqrd" contenteditable="false"><col width="146px" data-table-id="j89168rvqrd" data-col-id="i3bpg2i2oy"><col width="146px" data-table-id="j89168rvqrd" data-col-id="lpwv9bfkdxe"><col width="146px" data-table-id="j89168rvqrd" data-col-id="9oopcw7mbfq"><col width="146px" data-table-id="j89168rvqrd" data-col-id="ejdvsjml25"><col width="146px" data-table-id="j89168rvqrd" data-col-id="nialr8ceyks"></colgroup><tbody data-table-id="j89168rvqrd"><tr class="ql-table-row" data-table-id="j89168rvqrd" data-row-id="m8wb3vitcit" data-wrap-tag="tbody"><td class="ql-table-cell" data-table-id="j89168rvqrd" data-row-id="m8wb3vitcit" data-col-id="i3bpg2i2oy" data-wrap-tag="tbody" rowspan="3" colspan="5" data-empty-row="["v4r34a160is","n73z32w0t9l"]"><div class="ql-table-cell-inner" data-table-id="j89168rvqrd" data-row-id="m8wb3vitcit" data-col-id="i3bpg2i2oy" data-rowspan="3" data-colspan="5" data-tag="td" data-wrap-tag="tbody" data-empty-row="["v4r34a160is","n73z32w0t9l"]"><p></p></div></td></tr><tr class="ql-table-row" data-table-id="j89168rvqrd" data-row-id="v4r34a160is" data-wrap-tag="tbody"></tr><tr class="ql-table-row" data-table-id="j89168rvqrd" data-row-id="n73z32w0t9l" data-wrap-tag="tbody"></tr></tbody></table></div>', { browserName });
    const cell1 = page.locator('#container5 .ql-table-wrapper td').nth(0);
    const emptyRow1 = await cell1.getAttribute('data-empty-row');
    expect(emptyRow1).not.toBeNull();
    try {
      const data = JSON.parse(emptyRow1!);
      expect(data.length).toEqual(2);
    }
    catch {
      // data error
      expect(false).toEqual(true);
    }
    expect(await page.locator('#container5 .ql-table-wrapper tr').count()).toEqual(5);

    await editorPage.setContents([]);
    await createTableBySelect(page, 'container5', 5, 5);
    const newCell2Bound = (await page.locator('#container5 .ql-table-wrapper td').nth(0).boundingBox())!;
    expect(newCell2Bound).not.toBeNull();
    await page.locator('#container5 .ql-table-wrapper td').nth(0).click();
    await page.mouse.move(newCell2Bound.x + newCell2Bound.width * 0.5, newCell2Bound.y + newCell2Bound.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(newCell2Bound.x + newCell2Bound.width * 4.5, newCell2Bound.y + newCell2Bound.height * 3.5);
    await page.mouse.up();
    await editorPage.blur();
    await pasteHTML(page, '<div class="ql-table-wrapper" data-table-id="j89168rvqrd" contenteditable="false"><table class="ql-table" data-table-id="j89168rvqrd" cellpadding="0" cellspacing="0" style="margin-right: auto; width: 730px;"><colgroup data-table-id="j89168rvqrd" contenteditable="false"><col width="146px" data-table-id="j89168rvqrd" data-col-id="i3bpg2i2oy"><col width="146px" data-table-id="j89168rvqrd" data-col-id="lpwv9bfkdxe"><col width="146px" data-table-id="j89168rvqrd" data-col-id="9oopcw7mbfq"><col width="146px" data-table-id="j89168rvqrd" data-col-id="ejdvsjml25"><col width="146px" data-table-id="j89168rvqrd" data-col-id="nialr8ceyks"></colgroup><tbody data-table-id="j89168rvqrd"><tr class="ql-table-row" data-table-id="j89168rvqrd" data-row-id="m8wb3vitcit" data-wrap-tag="tbody"><td class="ql-table-cell" data-table-id="j89168rvqrd" data-row-id="m8wb3vitcit" data-col-id="i3bpg2i2oy" data-wrap-tag="tbody" rowspan="3" colspan="5" data-empty-row="[&quot;v4r34a160is&quot;,&quot;n73z32w0t9l&quot;]" style="height: 49px;"><div class="ql-table-cell-inner" data-table-id="j89168rvqrd" data-row-id="m8wb3vitcit" data-col-id="i3bpg2i2oy" data-rowspan="3" data-colspan="5" data-tag="td" data-wrap-tag="tbody" data-empty-row="[&quot;v4r34a160is&quot;,&quot;n73z32w0t9l&quot;]" data-style="height: 49px;"><p></p></div></td></tr><tr class="ql-table-row" data-table-id="j89168rvqrd" data-row-id="v4r34a160is" data-wrap-tag="tbody"></tr><tr class="ql-table-row" data-table-id="j89168rvqrd" data-row-id="n73z32w0t9l" data-wrap-tag="tbody"></tr><tr class="ql-table-row" data-table-id="j89168rvqrd" data-row-id="rfiuu54tyn" data-wrap-tag="tbody"><td class="ql-table-cell" data-table-id="j89168rvqrd" data-row-id="rfiuu54tyn" data-col-id="i3bpg2i2oy" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="j89168rvqrd" data-row-id="rfiuu54tyn" data-col-id="i3bpg2i2oy" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody"><p></p></div></td><td class="ql-table-cell" data-table-id="j89168rvqrd" data-row-id="rfiuu54tyn" data-col-id="lpwv9bfkdxe" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="j89168rvqrd" data-row-id="rfiuu54tyn" data-col-id="lpwv9bfkdxe" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody"><p></p></div></td><td class="ql-table-cell" data-table-id="j89168rvqrd" data-row-id="rfiuu54tyn" data-col-id="9oopcw7mbfq" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="j89168rvqrd" data-row-id="rfiuu54tyn" data-col-id="9oopcw7mbfq" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody"><p></p></div></td><td class="ql-table-cell" data-table-id="j89168rvqrd" data-row-id="rfiuu54tyn" data-col-id="ejdvsjml25" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="j89168rvqrd" data-row-id="rfiuu54tyn" data-col-id="ejdvsjml25" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody"><p></p></div></td><td class="ql-table-cell" data-table-id="j89168rvqrd" data-row-id="rfiuu54tyn" data-col-id="nialr8ceyks" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="j89168rvqrd" data-row-id="rfiuu54tyn" data-col-id="nialr8ceyks" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody"><p></p></div></td></tr></tbody></table></div>', { browserName });
    const cell2 = page.locator('#container5 .ql-table-wrapper td').nth(0);
    const emptyRow2 = await cell2.getAttribute('data-empty-row');
    expect(emptyRow2).not.toBeNull();
    try {
      const data = JSON.parse(emptyRow2!);
      expect(data.length).toEqual(2);
    }
    catch {
      // data error
      expect(false).toEqual(true);
    }
    expect(await page.locator('#container5 .ql-table-wrapper tr').count()).toEqual(5);
  });

  extendTest('paste cells with other Block', async ({ page, browserName, editorPage }) => {
    editorPage.page = page;
    editorPage.index = 4;
    await createTableBySelect(page, 'container5', 5, 5);

    const newCell1Bound = (await page.locator('#container5 .ql-table-wrapper td').nth(0).boundingBox())!;
    expect(newCell1Bound).not.toBeNull();
    await page.locator('#container5 .ql-table-wrapper td').nth(0).click();
    await page.mouse.move(newCell1Bound.x + newCell1Bound.width * 0.5, newCell1Bound.y + newCell1Bound.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(newCell1Bound.x + newCell1Bound.width * 2.5, newCell1Bound.y + newCell1Bound.height * 1.5);
    await page.mouse.up();
    await editorPage.blur();
    await pasteHTML(page, `<div class="ql-table-wrapper" data-table-id="bein21b5pui" contenteditable="false"><table class="ql-table" data-table-id="bein21b5pui" cellpadding="0" cellspacing="0" style="margin-right: auto; width: 444px;"><colgroup data-table-id="bein21b5pui" contenteditable="false"><col width="142px" data-table-id="bein21b5pui" data-col-id="481dzooan6g"><col width="159px" data-table-id="bein21b5pui" data-col-id="hz2gh55d0ib"><col width="143px" data-table-id="bein21b5pui" data-col-id="feqmvzorecq"></colgroup><tbody data-table-id="bein21b5pui"><tr class="ql-table-row" data-table-id="bein21b5pui" data-row-id="ge4p39olq3t" data-wrap-tag="tbody"><td class="ql-table-cell" data-table-id="bein21b5pui" data-row-id="ge4p39olq3t" data-col-id="481dzooan6g" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="bein21b5pui" data-row-id="ge4p39olq3t" data-col-id="481dzooan6g" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody"><p>1</p></div></td><td class="ql-table-cell" data-table-id="bein21b5pui" data-row-id="ge4p39olq3t" data-col-id="hz2gh55d0ib" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="bein21b5pui" data-row-id="ge4p39olq3t" data-col-id="hz2gh55d0ib" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody"><p>2<strong>123</strong>4</p><pre data-language="plain">www
</pre></div></td><td class="ql-table-cell" data-table-id="bein21b5pui" data-row-id="ge4p39olq3t" data-col-id="feqmvzorecq" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="bein21b5pui" data-row-id="ge4p39olq3t" data-col-id="feqmvzorecq" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody"><h1>3</h1></div></td></tr><tr class="ql-table-row" data-table-id="bein21b5pui" data-row-id="nvid3wj1n3" data-wrap-tag="tbody"><td class="ql-table-cell" data-table-id="bein21b5pui" data-row-id="nvid3wj1n3" data-col-id="481dzooan6g" data-wrap-tag="tbody" rowspan="1" colspan="2"><div class="ql-table-cell-inner" data-table-id="bein21b5pui" data-row-id="nvid3wj1n3" data-col-id="481dzooan6g" data-rowspan="1" data-colspan="2" data-tag="td" data-wrap-tag="tbody"><ol><li>4</li><li>5</li></ol><p></p></div></td><td class="ql-table-cell" data-table-id="bein21b5pui" data-row-id="nvid3wj1n3" data-col-id="feqmvzorecq" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="bein21b5pui" data-row-id="nvid3wj1n3" data-col-id="feqmvzorecq" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody"><p>6</p></div></td></tr></tbody></table></div>`, { browserName });

    const cells = page.locator('#container5 .ql-table-wrapper td');
    await expect(cells.nth(0)).toHaveText('1');
    await expect(cells.nth(1)).toHaveText('21234www');
    const strongEl = cells.nth(1).locator('strong');
    expect(await strongEl.count()).toEqual(1);
    await expect(strongEl).toHaveText('123');
    const codeBlock = cells.nth(1).locator('.ql-code-block-container');
    const codeBlockLine = cells.nth(1).locator('.ql-code-block-container .ql-code-block');
    expect(await codeBlock.count()).toEqual(1);
    expect(await codeBlockLine.count()).toEqual(1);
    await expect(cells.nth(2)).toHaveText('3');
    const header1 = cells.nth(2).locator('h1');
    expect(await header1.count()).toEqual(1);
    await expect(cells.nth(5)).toHaveText('45');
    await expect(cells.nth(5)).toHaveAttribute('colspan', '2');
    const orderedList = cells.nth(5).locator('ol');
    const orderedListItem = orderedList.locator('li');
    expect(await orderedList.count()).toEqual(1);
    const listItemCount = await orderedListItem.count();
    expect(listItemCount).toEqual(2);
    for (let i = 0; i < listItemCount; i++) {
      await expect(orderedListItem.nth(i)).toHaveAttribute('data-list', 'ordered');
    }
    await expect(cells.nth(6)).toHaveText('6');
  });
});

import { expect, test } from '@playwright/test';
import { createTableBySelect } from './utils';

test.beforeEach(async ({ page }) => {
  await page.goto('http://127.0.0.1:5500/docs/test.html');
});

test('freeze to row 1 sticks the first two rows at cascading top offsets', async ({ page }) => {
  await createTableBySelect(page, 'container1', 6, 2);
  const table = page.locator('#editor1 .ql-table');
  await table.locator('tr').first().locator('td, th').first().click();
  // select a cell in the 2nd row (index 1), then invoke FreezeRow via the module directly.
  // `window.quills[0]` is the Quill instance for `container1`/`editor1` (matches the
  // pattern already used in `table-keyboard-handler.test.ts`).
  await page.evaluate(() => {
    const tableMainBlot = window.Quill.find(document.querySelector('#editor1 .ql-table')!) as any;
    tableMainBlot.setFreezeRow(2);
  });

  const rows = table.locator('tr');
  await expect(rows.nth(0)).toHaveClass(/is-frozen/);
  await expect(rows.nth(1)).toHaveClass(/is-frozen/);
  await expect(rows.nth(2)).not.toHaveClass(/is-frozen/);

  const row0Top = await rows.nth(0).evaluate(el => (el as HTMLElement).style.top);
  const row1Top = await rows.nth(1).evaluate(el => (el as HTMLElement).style.top);
  expect(row0Top).toBe('0px');
  expect(row1Top).not.toBe('0px');
});

test('typing content that grows row height re-cascades frozen row offsets after a short delay', async ({ page }) => {
  await createTableBySelect(page, 'container1', 6, 2);
  await page.evaluate(() => {
    const tableMainBlot = window.Quill.find(document.querySelector('#editor1 .ql-table')!) as any;
    tableMainBlot.setFreezeRow(2);
  });

  const table = page.locator('#editor1 .ql-table');
  const rows = table.locator('tr');
  const row1TopBefore = await rows.nth(1).evaluate(el => (el as HTMLElement).style.top);

  // type enough text into row 0's cell to grow its height (wraps to multiple lines)
  await rows.nth(0).locator('td, th').first().click();
  await page.keyboard.type('a very long line of text that should wrap across more than one visual line inside this narrow table cell so the row grows taller\n'.repeat(2));

  // wait past the debounce window
  await page.waitForTimeout(300);
  const row1TopAfter = await rows.nth(1).evaluate(el => (el as HTMLElement).style.top);
  expect(row1TopAfter).not.toBe(row1TopBefore);
  await expect(rows.nth(1)).toHaveClass(/is-frozen-animate/);
});

test('drag-selecting through the frozen band does not select a scrolled-under ghost cell', async ({ page }) => {
  // `createTableBySelect`'s grid picker tops out at 8x8 and the custom-creator
  // dialog rejects sizes >= 30, so build a tall table via the custom-creator
  // dialog instead.
  await page.locator('#container1 .ql-toolbar .ql-table-up > .ql-picker-label').first().click();
  await page.locator('#container1 .ql-toolbar .ql-table-up .ql-custom-select').getByText('Custom').click();
  await page.locator('.table-up-input__item').nth(0).locator('input').fill('25');
  await page.locator('.table-up-input__item').nth(1).locator('input').fill('1');
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.locator('#editor1 .ql-table-wrapper').waitFor({ state: 'visible' });

  // give every cell a fixed, uniform height so all rows are pixel-identical —
  // real text-driven row heights carry sub-pixel jitter (line-height/font
  // metrics rounding) that makes landing a scrolled row exactly on top of the
  // frozen row's rect (down to the pixel) unreliable across browsers.
  await page.evaluate(() => {
    for (const td of Array.from(document.querySelectorAll('#editor1 .ql-table td, #editor1 .ql-table th'))) {
      (td as HTMLElement).style.height = '40px';
    }
  });

  await page.evaluate(() => {
    const tableMainBlot = window.Quill.find(document.querySelector('#editor1 .ql-table')!) as any;
    tableMainBlot.setFreezeRow(1);
  });

  // `.ql-table-wrapper` has `overflow: auto` (for horizontal scroll of wide
  // tables) but no bounded height, so by default `.ql-editor` (editor1's fixed
  // 600px box) ends up being the real scrolling ancestor instead — and since
  // sticky positioning binds to the NEAREST ancestor with overflow != visible
  // regardless of whether that ancestor itself scrolls, `.ql-table-wrapper`
  // "claims" the sticky containing block without actually being the element
  // that scrolls, which breaks stickiness entirely. Bound the wrapper's own
  // height so it becomes the actual scrolling container (matching how
  // `TableVirtualScrollbar` is architected to manage scrolling on this same
  // element) — this is what makes frozen rows actually stick during scroll.
  // The top padding pushes the frozen row's rect far enough away from the
  // wrapper's own top edge to stay clear of `TableSelection`'s built-in
  // autoscroll deadzone (`new AutoScroller(50, 40)`, i.e. within 40px of the
  // scroll container's edge), which would otherwise nudge the scroll position
  // mid-drag and make the test flaky for reasons unrelated to this fix.
  await page.evaluate(() => {
    const wrapper = document.querySelector('#editor1 .ql-table-wrapper') as HTMLElement;
    wrapper.style.maxHeight = '300px';
    wrapper.style.paddingTop = '50px';
  });

  // scroll so a later, non-frozen row's rect lands exactly on top of the
  // sticky frozen row's "stuck" rect (which never moves, regardless of scroll
  // position).
  await page.evaluate(() => {
    const wrapper = document.querySelector('#editor1 .ql-table-wrapper') as HTMLElement;
    const rows = Array.from(document.querySelectorAll('#editor1 .ql-table tr'));
    const rowTop = (i: number) => rows[i].querySelector('td, th')!.getBoundingClientRect().top;
    // row 8 landing exactly on row 0's (the frozen row) original position
    wrapper.scrollTop = rowTop(8) - rowTop(0);
  });

  const table = page.locator('#editor1 .ql-table');
  const frozenCell = table.locator('tr.is-frozen').first().locator('td, th').first();
  const box = (await frozenCell.boundingBox())!;

  // drag-select starting and ending inside the frozen band's screen rect
  await page.mouse.move(box.x + 2, box.y + 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 2, box.y + box.height - 2);
  await page.mouse.up();

  const selectedCount = await page.evaluate(() => {
    const tableModule = window.quills[0].getModule('table-up') as any;
    const selection = tableModule.getModule('table-selection');
    return selection.selectedTds.length;
  });
  // only the frozen cell itself should be selected, not the row scrolled underneath it
  expect(selectedCount).toBe(1);
});

test('selection overlay tracks a selection spanning frozen and scrolled rows after further scrolling', async ({ page }) => {
  await page.locator('#container1 .ql-toolbar .ql-table-up > .ql-picker-label').first().click();
  await page.locator('#container1 .ql-toolbar .ql-table-up .ql-custom-select').getByText('Custom').click();
  await page.locator('.table-up-input__item').nth(0).locator('input').fill('25');
  await page.locator('.table-up-input__item').nth(1).locator('input').fill('1');
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.locator('#editor1 .ql-table-wrapper').waitFor({ state: 'visible' });

  await page.evaluate(() => {
    for (const td of Array.from(document.querySelectorAll('#editor1 .ql-table td, #editor1 .ql-table th'))) {
      (td as HTMLElement).style.height = '40px';
    }
  });
  await page.evaluate(() => {
    const tableMainBlot = window.Quill.find(document.querySelector('#editor1 .ql-table')!) as any;
    tableMainBlot.setFreezeRow(1);
  });
  await page.evaluate(() => {
    const wrapper = document.querySelector('#editor1 .ql-table-wrapper') as HTMLElement;
    wrapper.style.maxHeight = '300px';
    wrapper.style.paddingTop = '50px';
  });

  // drag-select a range spanning the frozen row (row 0) and several
  // non-frozen rows below it
  const table = page.locator('#editor1 .ql-table');
  const rows = table.locator('tr');
  const startBox = (await rows.nth(0).locator('td, th').first().boundingBox())!;
  const endBox = (await rows.nth(3).locator('td, th').first().boundingBox())!;
  await page.mouse.move(startBox.x + 2, startBox.y + 2);
  await page.mouse.down();
  await page.mouse.move(endBox.x + endBox.width - 2, endBox.y + endBox.height - 2);
  await page.mouse.up();

  const selectedBefore = await page.evaluate(() => {
    const tableModule = window.quills[0].getModule('table-up') as any;
    return (tableModule.getModule('table-selection') as any).selectedTds.length;
  });
  expect(selectedBefore).toBe(4); // rows 0-3, 1 column each

  // scroll further after the selection is already made (not part of the
  // drag) — one row's worth, so row 3 stays genuinely visible below the
  // frozen band (a large scroll would push every non-frozen selected row
  // out of view, collapsing the overlay to just the frozen band itself,
  // which is a different, separately-covered scenario).
  await page.evaluate(() => {
    const wrapper = document.querySelector('#editor1 .ql-table-wrapper') as HTMLElement;
    wrapper.scrollTop += 40;
  });
  await page.waitForTimeout(50);

  // the overlay must match the *current* union of the still-selected cells:
  // row 0 (frozen, pinned at the wrapper's scrolled-into-view top) through
  // row 3 (now scrolled further up-screen than before, but still visible).
  const overlayBox = (await page.locator('#editor1 .table-up-selection__line').boundingBox())!;
  const frozenCellBox = (await rows.nth(0).locator('td, th').first().boundingBox())!;
  const lastCellBox = (await rows.nth(3).locator('td, th').last().boundingBox())!;

  expect(overlayBox.y).toBeCloseTo(frozenCellBox.y, 0);
  expect(overlayBox.y + overlayBox.height).toBeCloseTo(lastCellBox.y + lastCellBox.height, 0);
});

test('drag starting on a frozen cell computes the correct range across intervening scroll', async ({ page }) => {
  await page.locator('#container1 .ql-toolbar .ql-table-up > .ql-picker-label').first().click();
  await page.locator('#container1 .ql-toolbar .ql-table-up .ql-custom-select').getByText('Custom').click();
  await page.locator('.table-up-input__item').nth(0).locator('input').fill('25');
  await page.locator('.table-up-input__item').nth(1).locator('input').fill('1');
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.locator('#editor1 .ql-table-wrapper').waitFor({ state: 'visible' });

  await page.evaluate(() => {
    for (const td of Array.from(document.querySelectorAll('#editor1 .ql-table td, #editor1 .ql-table th'))) {
      (td as HTMLElement).style.height = '40px';
    }
  });
  await page.evaluate(() => {
    const tableMainBlot = window.Quill.find(document.querySelector('#editor1 .ql-table')!) as any;
    tableMainBlot.setFreezeRow(1);
  });
  await page.evaluate(() => {
    const wrapper = document.querySelector('#editor1 .ql-table-wrapper') as HTMLElement;
    wrapper.style.maxHeight = '300px';
    wrapper.style.paddingTop = '50px';
  });

  const table = page.locator('#editor1 .ql-table');
  const rows = table.locator('tr');
  const frozenBox = (await rows.nth(0).locator('td, th').first().boundingBox())!;

  // start the drag on the frozen row
  await page.mouse.move(frozenBox.x + 2, frozenBox.y + 2);
  await page.mouse.down();

  // scroll happens *mid-drag*, simulating what auto-scroll would do, without
  // any further mouse movement in between. Half a row's worth: enough to
  // exercise the scroll-diff correction, but not enough to fully hide any
  // intervening row behind the frozen band (a whole-row scroll would land
  // row 1 exactly behind the frozen row, correctly excluding it from the
  // drag as a ghost cell per the Task 7 fix — a real but separate scenario,
  // not what this test is checking).
  await page.evaluate(() => {
    const wrapper = document.querySelector('#editor1 .ql-table-wrapper') as HTMLElement;
    wrapper.scrollTop += 20;
  });

  // continue the drag down to row 3's current (post-scroll) position — the
  // row's vertical midpoint, not its edge, to stay clear of pixel-rounding
  // jitter at cell boundaries.
  const targetBox = (await rows.nth(3).locator('td, th').first().boundingBox())!;
  await page.mouse.move(targetBox.x + 2, targetBox.y + targetBox.height / 2);
  await page.mouse.up();

  const selectedCount = await page.evaluate(() => {
    const tableModule = window.quills[0].getModule('table-up') as any;
    return (tableModule.getModule('table-selection') as any).selectedTds.length;
  });
  // rows 0-3, 1 column each — the drag anchor (frozen row 0) must not drift
  // due to the scroll that happened mid-drag
  expect(selectedCount).toBe(4);
});

test('freeze to column 1 sticks the first two columns at cascading left offsets', async ({ page }) => {
  await createTableBySelect(page, 'container1', 3, 6);
  const table = page.locator('#editor1 .ql-table');
  await table.locator('tr').first().locator('td, th').first().click();
  await page.evaluate(() => {
    const tableMainBlot = window.Quill.find(document.querySelector('#editor1 .ql-table')!) as any;
    tableMainBlot.setFreezeCol(2);
  });

  const firstRowCells = table.locator('tr').first().locator('td, th');
  await expect(firstRowCells.nth(0)).toHaveClass(/is-frozen-col/);
  await expect(firstRowCells.nth(1)).toHaveClass(/is-frozen-col/);
  await expect(firstRowCells.nth(2)).not.toHaveClass(/is-frozen-col/);

  const cell0Left = await firstRowCells.nth(0).evaluate(el => (el as HTMLElement).style.left);
  const cell1Left = await firstRowCells.nth(1).evaluate(el => (el as HTMLElement).style.left);
  expect(cell0Left).toBe('0px');
  expect(cell1Left).not.toBe('0px');
});

test('dragging a column wider re-cascades frozen column left offsets immediately', async ({ page }) => {
  await createTableBySelect(page, 'container1', 3, 6);
  await page.evaluate(() => {
    const tableMainBlot = window.Quill.find(document.querySelector('#editor1 .ql-table')!) as any;
    tableMainBlot.setFreezeCol(2);
  });

  const table = page.locator('#editor1 .ql-table');
  const firstRowCells = table.locator('tr').first().locator('td, th');
  const cell1LeftBefore = await firstRowCells.nth(1).evaluate(el => (el as HTMLElement).style.left);

  // widen column 0 directly via the model (equivalent to a drag-resize)
  await page.evaluate(() => {
    const tableMainBlot = window.Quill.find(document.querySelector('#editor1 .ql-table')!) as any;
    const cols = tableMainBlot.getCols();
    cols[0].width += 60;
    window.quills[0].emitter.emit('after-table-resize');
  });
  await page.waitForTimeout(200);

  const cell1LeftAfter = await firstRowCells.nth(1).evaluate(el => (el as HTMLElement).style.left);
  expect(cell1LeftAfter).not.toBe(cell1LeftBefore);
});

test('freeze columns on a full-width table computes pixel offsets, not raw percentages', async ({ page }) => {
  await createTableBySelect(page, 'container1', 3, 6);
  await page.evaluate(() => {
    const tableMainBlot = window.Quill.find(document.querySelector('#editor1 .ql-table')!) as any;
    tableMainBlot.setFull();
  });
  // `setFull()` only marks each column's own `full` flag directly; the table
  // blot's own `full` flag (read by `updateFreezeCols()`) is set later via the
  // colgroup's `full` setter during Quill's mutation-observer-driven optimize
  // cycle, so give that a tick to flush before freezing columns.
  await page.waitForTimeout(50);
  await page.evaluate(() => {
    const tableMainBlot = window.Quill.find(document.querySelector('#editor1 .ql-table')!) as any;
    tableMainBlot.setFreezeCol(2);
  });

  const { cell1Left, expectedLeft, tableWidth } = await page.evaluate(() => {
    const tableMainBlot = window.Quill.find(document.querySelector('#editor1 .ql-table')!) as any;
    const cols = tableMainBlot.getCols();
    const tableWidth = (tableMainBlot.domNode as HTMLElement).getBoundingClientRect().width;
    // col0's width is stored as a raw percentage number (e.g. ~33.33) for a
    // `full` table; the correctly rendered pixel share is that percentage
    // applied to the table's actual rendered width
    const expectedLeft = cols[0].width / 100 * tableWidth;
    const firstRowCell1 = document.querySelectorAll('#editor1 .ql-table tr')[0].querySelectorAll('td, th')[1] as HTMLElement;
    const cell1Left = Number.parseFloat(firstRowCell1.style.left);
    return { cell1Left, expectedLeft, tableWidth };
  });

  // sanity check: the table must actually render wider than the raw
  // percentage number for this test to distinguish the bug from the fix
  expect(tableWidth).toBeGreaterThan(100);
  // the bug summed raw percentage numbers (e.g. ~33.33) as if they were
  // pixels; the fix must scale each column's percentage by the table's
  // actual rendered width instead
  expect(cell1Left).toBeCloseTo(expectedLeft, 0);
  expect(cell1Left).toBeGreaterThan(50);
});

test('drag-selecting through the frozen column band does not select a scrolled-under ghost cell', async ({ page }) => {
  await page.locator('#container1 .ql-toolbar .ql-table-up > .ql-picker-label').first().click();
  await page.locator('#container1 .ql-toolbar .ql-table-up .ql-custom-select').getByText('Custom').click();
  await page.locator('.table-up-input__item').nth(0).locator('input').fill('2');
  await page.locator('.table-up-input__item').nth(1).locator('input').fill('25');
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.locator('#editor1 .ql-table-wrapper').waitFor({ state: 'visible' });

  // give every cell a fixed, uniform width so columns are pixel-identical
  await page.evaluate(() => {
    const tableMainBlot = window.Quill.find(document.querySelector('#editor1 .ql-table')!) as any;
    for (const col of tableMainBlot.getCols()) {
      col.width = 100;
    }
  });
  await page.evaluate(() => {
    const tableMainBlot = window.Quill.find(document.querySelector('#editor1 .ql-table')!) as any;
    tableMainBlot.setFreezeCol(1);
  });
  await page.evaluate(() => {
    const wrapper = document.querySelector('#editor1 .ql-table-wrapper') as HTMLElement;
    wrapper.style.maxWidth = '300px';
    wrapper.style.paddingLeft = '50px';
  });

  // scroll so a later, non-frozen column's rect lands exactly on top of the
  // sticky frozen column's "stuck" rect (which never moves horizontally,
  // regardless of scroll position).
  await page.evaluate(() => {
    const wrapper = document.querySelector('#editor1 .ql-table-wrapper') as HTMLElement;
    const cells = Array.from(document.querySelectorAll('#editor1 .ql-table tr:first-child td, #editor1 .ql-table tr:first-child th'));
    const cellLeft = (i: number) => cells[i].getBoundingClientRect().left;
    // column 8 landing exactly on column 0's (the frozen column) original position
    wrapper.scrollLeft = cellLeft(8) - cellLeft(0);
  });

  const table = page.locator('#editor1 .ql-table');
  const frozenCell = table.locator('.is-frozen-col').first();
  const box = (await frozenCell.boundingBox())!;

  // drag-select starting and ending inside the frozen column's screen rect
  await page.mouse.move(box.x + 2, box.y + 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 2, box.y + box.height - 2);
  await page.mouse.up();

  const selectedCount = await page.evaluate(() => {
    const tableModule = window.quills[0].getModule('table-up') as any;
    const selection = tableModule.getModule('table-selection');
    return selection.selectedTds.length;
  });
  // only the frozen cell itself should be selected, not the column scrolled underneath it
  expect(selectedCount).toBe(1);
});

test('corner cell (frozen row + frozen column) stays pinned in both directions while scrolling', async ({ page }) => {
  await page.locator('#container1 .ql-toolbar .ql-table-up > .ql-picker-label').first().click();
  await page.locator('#container1 .ql-toolbar .ql-table-up .ql-custom-select').getByText('Custom').click();
  await page.locator('.table-up-input__item').nth(0).locator('input').fill('15');
  await page.locator('.table-up-input__item').nth(1).locator('input').fill('8');
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.locator('#editor1 .ql-table-wrapper').waitFor({ state: 'visible' });

  await page.evaluate(() => {
    const tableMainBlot = window.Quill.find(document.querySelector('#editor1 .ql-table')!) as any;
    for (const col of tableMainBlot.getCols()) {
      col.width = 80;
    }
    for (const td of Array.from(document.querySelectorAll('#editor1 .ql-table td, #editor1 .ql-table th'))) {
      (td as HTMLElement).style.height = '40px';
    }
  });
  await page.evaluate(() => {
    const tableMainBlot = window.Quill.find(document.querySelector('#editor1 .ql-table')!) as any;
    tableMainBlot.setFreezeRow(1);
    tableMainBlot.setFreezeCol(1);
  });
  await page.evaluate(() => {
    const wrapper = document.querySelector('#editor1 .ql-table-wrapper') as HTMLElement;
    wrapper.style.maxHeight = '200px';
    wrapper.style.maxWidth = '300px';
  });

  const corner = page.locator('#editor1 .ql-table tr').first().locator('td, th').first();
  const cornerBoxBefore = (await corner.boundingBox())!;

  await page.evaluate(() => {
    const wrapper = document.querySelector('#editor1 .ql-table-wrapper') as HTMLElement;
    wrapper.scrollTop = 100;
    wrapper.scrollLeft = 100;
    wrapper.dispatchEvent(new Event('scroll'));
  });

  const cornerBoxAfter = (await corner.boundingBox())!;
  expect(cornerBoxAfter.x).toBeCloseTo(cornerBoxBefore.x, 0);
  expect(cornerBoxAfter.y).toBeCloseTo(cornerBoxBefore.y, 0);

  // the corner must visually paint above content scrolling underneath it in
  // both directions - confirmed by z-index ordering rather than pixel
  // sampling, which is brittle across browsers/fonts
  const cornerZIndex = await corner.evaluate(el => getComputedStyle(el).zIndex);
  const plainCellZIndex = await page.locator('#editor1 .ql-table tr').nth(2).locator('td, th').nth(2).evaluate(el => getComputedStyle(el).zIndex);
  expect(Number(cornerZIndex)).toBeGreaterThan(Number(plainCellZIndex) || 0);
});

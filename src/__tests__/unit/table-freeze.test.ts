import type { TableColFormat } from '../../formats';
import type { ToolOption } from '../../utils';
import Quill from 'quill';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TableCellInnerFormat } from '../../formats';
import { tableMenuTools } from '../../modules';
import { TableUp } from '../../table-up';
import { createQuillWithTableModule, createTable } from './utils';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('table freeze row data model', () => {
  it('TableColFormat.freezeRow defaults to 0 and round-trips through the delta when set', async () => {
    const quill = await createTable(2, 2, { full: false });
    const col = quill.root.querySelector('col')!;
    const colBlot = Quill.find(col) as TableColFormat;
    expect(colBlot.freezeRow).toBe(0);

    colBlot.freezeRow = 1;
    expect(colBlot.freezeRow).toBe(1);
    await vi.runAllTimersAsync();
    const delta = quill.getContents();
    const colOp = delta.ops.find(op => (op.insert as any)?.['table-up-col']?.colId === colBlot.colId);
    expect((colOp!.insert as any)['table-up-col'].freezeRow).toBe(1);

    colBlot.freezeRow = 0;
    expect(colBlot.domNode.dataset.freezeRow).toBeUndefined();
    await vi.runAllTimersAsync();
    const delta2 = quill.getContents();
    const colOp2 = delta2.ops.find(op => (op.insert as any)?.['table-up-col']?.colId === colBlot.colId);
    expect((colOp2!.insert as any)['table-up-col'].freezeRow).toBeUndefined();
  });
});

describe('table freeze row aggregate', () => {
  it('TableMainFormat.setFreezeRow writes freezeRow to every column and appendCol inherits it', async () => {
    const quill = await createTable(2, 2, { full: false });
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const table = quill.root.querySelector('table')!;
    const tableMainBlot = Quill.find(table) as any;

    tableMainBlot.setFreezeRow(1);
    expect(tableMainBlot.freezeRow).toBe(1);
    for (const col of tableMainBlot.getCols()) {
      expect(col.freezeRow).toBe(1);
    }

    // insert a new column and confirm it inherits freezeRow
    const cellInners = tableMainBlot.descendants(TableCellInnerFormat) as TableCellInnerFormat[];
    tableModule.appendCol([cellInners[0]], true);
    for (const col of tableMainBlot.getCols()) {
      expect(col.freezeRow).toBe(1);
    }
  });
});

describe('table freeze row menu tools', () => {
  it('FreezeRow tool freezes rows 0..x based on the selected cells max row index', async () => {
    const quill = await createTable(4, 2, { full: false });
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const table = quill.root.querySelector('table')!;
    const tableMainBlot = Quill.find(table) as any;
    const cellInners = tableMainBlot.descendants(TableCellInnerFormat) as TableCellInnerFormat[];
    // cell in row index 1 (2nd row)
    const targetCell = cellInners.find(c => c.getRowIndex() === 1)!;

    (tableMenuTools.FreezeRow as ToolOption).handle.call({ quill, table } as any, tableModule, [targetCell], null);

    expect(tableMainBlot.freezeRow).toBe(2);

    (tableMenuTools.UnfreezeRow as ToolOption).handle.call({ quill, table } as any, tableModule, [targetCell], null);
    expect(tableMainBlot.freezeRow).toBe(0);
  });

  it('FreezeRow tool snaps the boundary past a rowspan cell it would otherwise cut through', async () => {
    const quill = await createTable(4, 2, { full: false });
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const table = quill.root.querySelector('table')!;
    const tableMainBlot = Quill.find(table) as any;
    const cellInners = tableMainBlot.descendants(TableCellInnerFormat) as TableCellInnerFormat[];
    // merge the top-left cell (row 0) down across rows 0-2 (rowspan 3)
    const topLeft = cellInners.find(c => c.getRowIndex() === 0)!;
    tableModule.mergeCells(cellInners.filter(c => c.getRowIndex() <= 2 && c.colId === topLeft.colId));
    await vi.runAllTimersAsync();

    // select a cell in row index 1 only (inside the merged span) and freeze
    const refreshedCellInners = tableMainBlot.descendants(TableCellInnerFormat) as TableCellInnerFormat[];
    const otherColCellRow1 = refreshedCellInners.find(c => c.getRowIndex() === 1 && c.colId !== topLeft.colId)!;
    (tableMenuTools.FreezeRow as ToolOption).handle.call({ quill, table } as any, tableModule, [otherColCellRow1], null);

    // boundary must be pushed to 3 (past the rowspan=3 cell starting at row 0), not 2
    expect(tableMainBlot.freezeRow).toBe(3);
  });
});

it('freezeRow survives a full delta round-trip (save/reload simulation)', async () => {
  const quill = await createTable(3, 2, { full: false });
  const table = quill.root.querySelector('table')!;
  const tableMainBlot = Quill.find(table) as any;
  tableMainBlot.setFreezeRow(1);
  await vi.runAllTimersAsync();

  const delta = quill.getContents();

  // simulate save/reload: feed the same delta into a fresh editor instance
  const quill2 = createQuillWithTableModule('<p><br></p>');
  quill2.setContents(delta);
  await vi.runAllTimersAsync();
  const table2 = quill2.root.querySelector('table')!;
  const tableMainBlot2 = Quill.find(table2) as any;
  expect(tableMainBlot2.freezeRow).toBe(1);
});

describe('table freeze col data model', () => {
  it('TableColFormat.freezeCol defaults to 0 and round-trips through the delta when set', async () => {
    const quill = await createTable(2, 2, { full: false });
    const col = quill.root.querySelector('col')!;
    const colBlot = Quill.find(col) as TableColFormat;
    expect(colBlot.freezeCol).toBe(0);

    colBlot.freezeCol = 1;
    expect(colBlot.freezeCol).toBe(1);
    await vi.runAllTimersAsync();
    const delta = quill.getContents();
    const colOp = delta.ops.find(op => (op.insert as any)?.['table-up-col']?.colId === colBlot.colId);
    expect((colOp!.insert as any)['table-up-col'].freezeCol).toBe(1);

    colBlot.freezeCol = 0;
    expect(colBlot.domNode.dataset.freezeCol).toBeUndefined();
    await vi.runAllTimersAsync();
    const delta2 = quill.getContents();
    const colOp2 = delta2.ops.find(op => (op.insert as any)?.['table-up-col']?.colId === colBlot.colId);
    expect((colOp2!.insert as any)['table-up-col'].freezeCol).toBeUndefined();
  });
});

describe('table freeze col aggregate', () => {
  it('TableMainFormat.setFreezeCol writes freezeCol to every column and appendCol inherits it', async () => {
    const quill = await createTable(2, 2, { full: false });
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const table = quill.root.querySelector('table')!;
    const tableMainBlot = Quill.find(table) as any;

    tableMainBlot.setFreezeCol(1);
    expect(tableMainBlot.freezeCol).toBe(1);
    for (const col of tableMainBlot.getCols()) {
      expect(col.freezeCol).toBe(1);
    }

    // insert a new column and confirm it inherits freezeCol
    const cellInners = tableMainBlot.descendants(TableCellInnerFormat) as TableCellInnerFormat[];
    tableModule.appendCol([cellInners[0]], true);
    for (const col of tableMainBlot.getCols()) {
      expect(col.freezeCol).toBe(1);
    }
  });
});

describe('table freeze isFrozenRow/isFrozenCol getters', () => {
  it('TableCellFormat and TableCellInnerFormat report isFrozenRow/isFrozenCol from the table\'s freezeRow/freezeCol', async () => {
    const quill = await createTable(3, 3, { full: false });
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const table = quill.root.querySelector('table')!;
    const tableMainBlot = Quill.find(table) as any;
    tableMainBlot.setFreezeRow(1);
    tableMainBlot.setFreezeCol(1);

    const cellInners = tableMainBlot.descendants(TableCellInnerFormat) as TableCellInnerFormat[];
    // row 0, col 0 -> both frozen (corner)
    const corner = cellInners.find(c => c.getRowIndex() === 0 && c.getColumnIndex() === 0)!;
    expect(corner.isFrozenRow).toBe(true);
    expect(corner.isFrozenCol).toBe(true);
    expect(corner.parent.isFrozenRow).toBe(true);
    expect(corner.parent.isFrozenCol).toBe(true);

    // row 0, col 1 -> only row-frozen
    const rowOnly = cellInners.find(c => c.getRowIndex() === 0 && c.getColumnIndex() === 1)!;
    expect(rowOnly.isFrozenRow).toBe(true);
    expect(rowOnly.isFrozenCol).toBe(false);

    // row 1, col 0 -> only col-frozen
    const colOnly = cellInners.find(c => c.getRowIndex() === 1 && c.getColumnIndex() === 0)!;
    expect(colOnly.isFrozenRow).toBe(false);
    expect(colOnly.isFrozenCol).toBe(true);

    // row 1, col 1 -> neither
    const neither = cellInners.find(c => c.getRowIndex() === 1 && c.getColumnIndex() === 1)!;
    expect(neither.isFrozenRow).toBe(false);
    expect(neither.isFrozenCol).toBe(false);
    void tableModule;
  });
});

describe('table freeze col menu tools', () => {
  it('FreezeCol tool freezes columns 0..x based on the selected cells max column index', async () => {
    const quill = await createTable(2, 4, { full: false });
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const table = quill.root.querySelector('table')!;
    const tableMainBlot = Quill.find(table) as any;
    const cellInners = tableMainBlot.descendants(TableCellInnerFormat) as TableCellInnerFormat[];
    // cell in column index 1 (2nd column)
    const targetCell = cellInners.find(c => c.getColumnIndex() === 1)!;

    (tableMenuTools.FreezeCol as ToolOption).handle.call({ quill, table } as any, tableModule, [targetCell], null);

    expect(tableMainBlot.freezeCol).toBe(2);

    (tableMenuTools.UnfreezeCol as ToolOption).handle.call({ quill, table } as any, tableModule, [targetCell], null);
    expect(tableMainBlot.freezeCol).toBe(0);
  });

  it('FreezeCol tool snaps the boundary past a colspan cell it would otherwise cut through', async () => {
    const quill = await createTable(2, 4, { full: false });
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const table = quill.root.querySelector('table')!;
    const tableMainBlot = Quill.find(table) as any;
    const cellInners = tableMainBlot.descendants(TableCellInnerFormat) as TableCellInnerFormat[];
    // merge the top-left cell (col 0) across cols 0-2 (colspan 3)
    const topLeft = cellInners.find(c => c.getRowIndex() === 0 && c.getColumnIndex() === 0)!;
    tableModule.mergeCells(cellInners.filter(c => c.getRowIndex() === 0 && c.getColumnIndex() <= 2));
    await vi.runAllTimersAsync();

    // select a cell in column index 1 only (inside the merged span) and freeze
    const refreshedCellInners = tableMainBlot.descendants(TableCellInnerFormat) as TableCellInnerFormat[];
    const otherRowCellCol1 = refreshedCellInners.find(c => c.getColumnIndex() === 1 && c.rowId !== topLeft.rowId)!;
    (tableMenuTools.FreezeCol as ToolOption).handle.call({ quill, table } as any, tableModule, [otherRowCellCol1], null);

    // boundary must be pushed to 3 (past the colspan=3 cell starting at col 0), not 2
    expect(tableMainBlot.freezeCol).toBe(3);
  });
});

it('freezeCol survives a full delta round-trip (save/reload simulation)', async () => {
  const quill = await createTable(3, 3, { full: false });
  const table = quill.root.querySelector('table')!;
  const tableMainBlot = Quill.find(table) as any;
  tableMainBlot.setFreezeCol(1);
  await vi.runAllTimersAsync();

  const delta = quill.getContents();

  // simulate save/reload: feed the same delta into a fresh editor instance
  const quill2 = createQuillWithTableModule('<p><br></p>');
  quill2.setContents(delta);
  await vi.runAllTimersAsync();
  const table2 = quill2.root.querySelector('table')!;
  const tableMainBlot2 = Quill.find(table2) as any;
  expect(tableMainBlot2.freezeCol).toBe(1);
});

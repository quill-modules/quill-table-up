import type { TableMainFormat } from '../../formats';
import type { Tool, ToolOption } from '../../utils';
import Quill from 'quill';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TableCellInnerFormat } from '../../formats';
import { TableMenuCommon, tableMenuTools } from '../../modules';
import { TableUp } from '../../table-up';
import { createTable } from './utils';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('ConvertTothead / ConvertTotfoot menu show', () => {
  it('ConvertTothead.show is true while any selected cell is not in thead, false once every selected cell is', async () => {
    const quill = await createTable(2, 2, { full: false });
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const table = quill.root.querySelector('table')!;
    const tableMainBlot = Quill.find(table) as TableMainFormat;
    let cellInners = tableMainBlot.descendants(TableCellInnerFormat) as TableCellInnerFormat[];
    const show = (tableMenuTools.ConvertTothead as ToolOption).show!;

    // all cells start in tbody
    expect(show.call({} as any, tableModule, cellInners, tableMainBlot)).toBe(true);

    // move row 0 into thead
    const rowZeroCells = cellInners.filter(c => c.getRowIndex() === 0);
    tableModule.convertTableBodyByCells(tableMainBlot, rowZeroCells, 'thead');
    await vi.runAllTimersAsync();

    cellInners = tableMainBlot.descendants(TableCellInnerFormat) as TableCellInnerFormat[];
    const inThead = cellInners.filter(c => c.wrapTag === 'thead');
    const inTbody = cellInners.filter(c => c.wrapTag === 'tbody');
    expect(inThead.length).toBeGreaterThan(0);

    // selection entirely in thead -> hide
    expect(show.call({} as any, tableModule, inThead, tableMainBlot)).toBe(false);
    // any cell outside thead in the selection -> show
    expect(show.call({} as any, tableModule, [...inThead, ...inTbody], tableMainBlot)).toBe(true);
  });

  it('ConvertTotfoot.show is true while any selected cell is not in tfoot, false once every selected cell is', async () => {
    const quill = await createTable(2, 2, { full: false });
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const table = quill.root.querySelector('table')!;
    const tableMainBlot = Quill.find(table) as TableMainFormat;
    let cellInners = tableMainBlot.descendants(TableCellInnerFormat) as TableCellInnerFormat[];
    const show = (tableMenuTools.ConvertTotfoot as ToolOption).show!;

    expect(show.call({} as any, tableModule, cellInners, tableMainBlot)).toBe(true);

    const lastRow = Math.max(...cellInners.map(c => c.getRowIndex()));
    const lastRowCells = cellInners.filter(c => c.getRowIndex() === lastRow);
    tableModule.convertTableBodyByCells(tableMainBlot, lastRowCells, 'tfoot');
    await vi.runAllTimersAsync();

    cellInners = tableMainBlot.descendants(TableCellInnerFormat) as TableCellInnerFormat[];
    const inTfoot = cellInners.filter(c => c.wrapTag === 'tfoot');
    expect(inTfoot.length).toBeGreaterThan(0);

    expect(show.call({} as any, tableModule, inTfoot, tableMainBlot)).toBe(false);
  });
});

// #region refreshVisibility
function buildMenuWithTools(quill: Quill, tools: Tool[], selectedTds: TableCellInnerFormat[]) {
  const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
  const menu = new TableMenuCommon(tableModule, quill, { tools });
  const table = quill.root.querySelector('table')!;
  (menu as any).table = table;
  menu.getSelectedTds = () => selectedTds;
  menu.show();
  return menu;
}

function isHidden(dom: HTMLElement) {
  return dom.style.display === 'none';
}
// #endregion

describe('TableMenuCommon.refreshVisibility break collapse', () => {
  it('applies show predicates and hides the item DOM when they return false', async () => {
    const quill = await createTable(2, 2, { full: false });
    const table = quill.root.querySelector('table')!;
    const tableMainBlot = Quill.find(table) as TableMainFormat;
    const cell = (tableMainBlot.descendants(TableCellInnerFormat) as TableCellInnerFormat[])[0];

    const alwaysHidden: ToolOption = {
      name: 'Hidden',
      icon: '<svg></svg>',
      handle: () => {},
      show: () => false,
    };
    const menu = buildMenuWithTools(quill, [tableMenuTools.CopyCell, alwaysHidden], [cell]);
    menu.refreshVisibility();

    expect(isHidden(menu.toolItems[0].dom)).toBe(false);
    expect(isHidden(menu.toolItems[1].dom)).toBe(true);
  });

  it('hides leading and trailing breaks and collapses breaks around a hidden middle item', async () => {
    const quill = await createTable(2, 2, { full: false });
    const table = quill.root.querySelector('table')!;
    const tableMainBlot = Quill.find(table) as TableMainFormat;
    const cell = (tableMainBlot.descendants(TableCellInnerFormat) as TableCellInnerFormat[])[0];

    const visible = (name: string): ToolOption => ({ name, icon: '<svg></svg>', handle: () => {} });
    const hidden = (name: string): ToolOption => ({ name, icon: '<svg></svg>', handle: () => {}, show: () => false });

    // layout: [break, A(hidden), break, B(visible), break, C(visible), break]
    // expected visible after refresh: only B and C, with exactly one break between them
    const tools: Tool[] = [
      tableMenuTools.Break,
      hidden('A'),
      tableMenuTools.Break,
      visible('B'),
      tableMenuTools.Break,
      visible('C'),
      tableMenuTools.Break,
    ];
    const menu = buildMenuWithTools(quill, tools, [cell]);
    menu.refreshVisibility();

    const items = menu.toolItems;
    expect(isHidden(items[0].dom)).toBe(true); // leading break
    expect(isHidden(items[1].dom)).toBe(true); // A hidden by show
    expect(isHidden(items[2].dom)).toBe(true); // break sandwiched between hidden A and B -> collapsed
    expect(isHidden(items[3].dom)).toBe(false); // B
    expect(isHidden(items[4].dom)).toBe(false); // break between B and C stays
    expect(isHidden(items[5].dom)).toBe(false); // C
    expect(isHidden(items[6].dom)).toBe(true); // trailing break
  });

  it('re-evaluates show predicates on each refresh (menu is not rebuilt on cell change)', async () => {
    const quill = await createTable(3, 2, { full: false });
    const table = quill.root.querySelector('table')!;
    const tableMainBlot = Quill.find(table) as TableMainFormat;
    const cell = (tableMainBlot.descendants(TableCellInnerFormat) as TableCellInnerFormat[])[0];

    const tools: Tool[] = [tableMenuTools.UnfreezeRow];
    const menu = buildMenuWithTools(quill, tools, [cell]);
    menu.refreshVisibility();
    expect(isHidden(menu.toolItems[0].dom)).toBe(true); // freezeRow == 0

    tableMainBlot.freezeRow = 1;
    menu.refreshVisibility();
    expect(isHidden(menu.toolItems[0].dom)).toBe(false); // now unfreeze is available
  });
});

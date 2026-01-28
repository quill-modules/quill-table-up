import type { TableCellInnerFormat, TableMainFormat } from '../../formats';
import type { TableUp } from '../../table-up';
import type { Tool } from '../../utils';
import Quill from 'quill';
import AutoFull from '../../svg/auto-full.svg';
import Background from '../../svg/background.svg';
import Border from '../../svg/border.svg';
import ConvertCell from '../../svg/convert-cell.svg';
import Copy from '../../svg/copy.svg';
import Cut from '../../svg/cut.svg';
import FillColumn from '../../svg/fill-column.svg';
import InsertBottom from '../../svg/insert-bottom.svg';
import InsertLeft from '../../svg/insert-left.svg';
import InsertRight from '../../svg/insert-right.svg';
import InsertTop from '../../svg/insert-top.svg';
import MergeCell from '../../svg/merge-cell.svg';
import RemoveColumn from '../../svg/remove-column.svg';
import RemoveRow from '../../svg/remove-row.svg';
import RemoveTable from '../../svg/remove-table.svg';
import SplitCell from '../../svg/split-cell.svg';
import TableHead from '../../svg/table-head.svg';
import { blotName, createBEM } from '../../utils';

export const menuColorSelectClassName = 'color-selector';
export async function copyCell(tableModule: TableUp, selectedTds: TableCellInnerFormat[], isCut: boolean = false) {
  const text = tableModule.getTextByCell(selectedTds);
  const html = tableModule.getHTMLByCell(selectedTds, isCut);

  const clipboardItem = new ClipboardItem({
    'text/plain': new Blob([text], { type: 'text/plain' }),
    'text/html': new Blob([html], { type: 'text/html' }),
  });
  await navigator.clipboard.write([clipboardItem]);
}
export const tableMenuTools: Record<string, Tool> = {
  Break: {
    name: 'break',
  },
  CopyCell: {
    name: 'CopyCell',
    tip: 'Copy cell',
    icon: Copy,
    handle(tableModule, selectedTds) {
      copyCell.call(this, tableModule, selectedTds, false);
    },
  },
  CutCell: {
    name: 'CutCell',
    tip: 'Cut cell',
    icon: Cut,
    handle(tableModule, selectedTds) {
      copyCell.call(this, tableModule, selectedTds, true);
    },
  },
  InsertTop: {
    name: 'InsertTop',
    icon: InsertTop,
    tip: 'Insert row above',
    handle(tableModule, selectedTds) {
      tableModule.appendRow(selectedTds, false);
    },
  },
  InsertRight: {
    name: 'InsertRight',
    icon: InsertRight,
    tip: 'Insert column right',
    handle(tableModule, selectedTds) {
      tableModule.appendCol(selectedTds, true);
    },
  },
  InsertBottom: {
    name: 'InsertBottom',
    icon: InsertBottom,
    tip: 'Insert row below',
    handle(tableModule, selectedTds) {
      tableModule.appendRow(selectedTds, true);
    },
  },
  InsertLeft: {
    name: 'InsertLeft',
    icon: InsertLeft,
    tip: 'Insert column Left',
    handle(tableModule, selectedTds) {
      tableModule.appendCol(selectedTds, false);
    },
  },
  MergeCell: {
    name: 'MergeCell',
    icon: MergeCell,
    tip: 'Merge Cell',
    handle(tableModule, selectedTds) {
      tableModule.mergeCells(selectedTds);
    },
  },
  SplitCell: {
    name: 'SplitCell',
    icon: SplitCell,
    tip: 'Split Cell',
    handle(tableModule, selectedTds) {
      tableModule.splitCell(selectedTds);
    },
  },
  DeleteRow: {
    name: 'DeleteRow',
    icon: RemoveRow,
    tip: 'Delete Row',
    handle(tableModule, selectedTds) {
      tableModule.removeRow(selectedTds);
    },
  },
  DeleteColumn: {
    name: 'DeleteColumn',
    icon: RemoveColumn,
    tip: 'Delete Column',
    handle(tableModule, selectedTds) {
      tableModule.removeCol(selectedTds);
    },
  },
  DeleteTable: {
    name: 'DeleteTable',
    icon: RemoveTable,
    tip: 'Delete table',
    handle(tableModule, selectedTds) {
      tableModule.deleteTable(selectedTds);
    },
  },
  BackgroundColor: {
    name: 'BackgroundColor',
    icon: Background,
    isColorChoose: true,
    tip: 'Set background color',
    key: 'background-color',
    handle(tableModule, selectedTds, color) {
      tableModule.setCellAttrs(selectedTds, 'background-color', color, true);
    },
  },
  BorderColor: {
    name: 'BorderColor',
    icon: Border,
    isColorChoose: true,
    tip: 'Set border color',
    key: 'border-color',
    handle(tableModule, selectedTds, color) {
      tableModule.setCellAttrs(selectedTds, 'border-color', color, true);
    },
  },
  SwitchWidth: {
    name: 'SwitchWidth',
    icon: AutoFull,
    tip: 'Switch table width',
    handle() {
      if (!this.table) return;
      const tableMainBlot = Quill.find(this.table) as TableMainFormat;
      if (!tableMainBlot) return;

      if (tableMainBlot.full) {
        tableMainBlot.cancelFull();
      }
      else {
        tableMainBlot.setFull();
      }
    },
  },
  InsertCaption: {
    name: 'InsertCaption',
    icon: TableHead,
    tip: 'Insert table caption',
    handle() {
      if (!this.table) return;
      const tableMainBlot = Quill.find(this.table) as TableMainFormat;
      if (!tableMainBlot) return;

      const tableCaption = this.quill.scroll.create('text', 'Table Caption').wrap(blotName.tableCaption, {
        tableId: tableMainBlot.tableId,
      });
      tableMainBlot.insertBefore(tableCaption, tableMainBlot.children.head);
    },
  },
  ToggleTdBetweenTh: {
    name: 'ToggleTdBetweenTh',
    icon: ConvertCell,
    tip: 'Toggle td between th',
    handle(tableModule, selectedTds) {
      for (const td of selectedTds) {
        td.convertTableCell();
      }
    },
  },
  ConvertTothead: {
    name: 'ConvertTothead',
    icon: ConvertCell,
    tip: 'Convert to thead',
    handle(tableModule, selectedTds) {
      if (!this.table) return;
      const tableMainBlot = Quill.find(this.table) as TableMainFormat;
      if (!tableMainBlot) return;

      tableModule.convertTableBodyByCells(tableMainBlot, selectedTds, 'thead');
    },
  },
  ConvertTotfoot: {
    name: 'ConvertTotfoot',
    icon: ConvertCell,
    tip: 'Convert to tfoot',
    handle(tableModule, selectedTds) {
      if (!this.table) return;
      const tableMainBlot = Quill.find(this.table) as TableMainFormat;
      if (!tableMainBlot) return;

      tableModule.convertTableBodyByCells(tableMainBlot, selectedTds, 'tfoot');
    },
  },
  FixedColumn: {
    name: 'FixedColumn',
    icon: FillColumn,
    tip: 'Fixed column',
    handle(tableModule, selectedTds) {
      if (!this.table) return;
      const tableMainBlot = Quill.find(this.table) as TableMainFormat;
      if (!tableMainBlot) return;
      const rows = tableMainBlot.getRows();
      const colIds = tableMainBlot.getColIds();
      // get all colIds that selected td
      // TODO 只处理选中的行
      const getSelectedColIds = selectedTds.reduce((s, td) => s.add(td.colId), new Set<string>());
      const fixedColIds = rows.reduce((s, row) => {
        for (const id of getSelectedColIds) {
          const cell = row.getCellByColId(id, 'prev');
          if (cell) {
            const colId = cell.colId;
            const index = colIds.indexOf(colId);
            if (index !== -1) {
              for (let i = 0; i < cell.colspan; i++) {
                s.add(colIds[index + i]);
              }
            }
          }
        }
        return s;
      }, new Set<string>());
      // get all fixed cells
      const fixedCells = rows.map((r) => {
        const cells = new Set<TableCellInnerFormat>();
        for (const id of fixedColIds) {
          const cell = r.getCellByColId(id, 'prev');
          const cellInnerBlot = cell?.getCellInner();
          if (cellInnerBlot) {
            cells.add(cellInnerBlot);
          }
        }
        return Array.from(cells);
      });
      for (const cells of fixedCells) {
        for (const cell of cells) {
          cell.fixed = 'left';
        }
      }
    },
  },
};

export const maxSaveColorCount = 10;
const bem = createBEM('color-map');
export const colorClassName = {
  selectWrapper: bem.b(),
  used: bem.bm('used'),
  item: bem.be('item'),
  btn: bem.be('btn'),
  map: bem.be('content'),
  mapRow: bem.be('content-row'),
};

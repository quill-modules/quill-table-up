import type { TableCellFormat, TableColFormat } from '../../formats';
import type { TableUp } from '../../table-up';
import type { TableSelection } from '../table-selection';
import Quill from 'quill';
import { getTableMainRect, TableRowFormat } from '../../formats';
import { addScrollEvent, blotName, clearScrollEvent, createBEM, dragElement, findParentBlot, tableUpInternal } from '../../utils';
import { TableResizeCommon } from './table-resize-common';
import { isTableAlignRight } from './utils';

export class TableResizeLine extends TableResizeCommon {
  static moduleName = 'table-resize-line';

  colResizer?: HTMLElement;
  rowResizer?: HTMLElement;
  currentTableCell?: HTMLElement;
  tableCellBlot?: TableCellFormat;
  bem = createBEM('resize-line');
  stopColDrag?: () => void;
  stopRowDrag?: () => void;
  scrollHandler: [HTMLElement, (e: Event) => void][] = [];

  constructor(public tableModule: TableUp, public quill: Quill) {
    super(tableModule, quill);
    this.colResizer = this.tableModule.addContainer(this.bem.be('col'));
    this.rowResizer = this.tableModule.addContainer(this.bem.be('row'));

    this.quill.on(Quill.events.EDITOR_CHANGE, this.updateWhenTextChange);
  }

  setSelectionTable(table: HTMLTableElement | undefined) {
    if (this.table === table) return;
    this.hide();
    this.table = table;
    if (this.table) {
      this.show();
    }
  }

  updateWhenTextChange = (eventName: string) => {
    if (eventName === Quill.events.TEXT_CHANGE) {
      if (this.table && !this.quill.root.contains(this.table)) {
        this.setSelectionTable(undefined);
      }
      else {
        this.update();
      }
    }
  };

  findTableCell(e: MouseEvent) {
    for (const el of e.composedPath()) {
      if (el instanceof HTMLElement && ['TD', 'TH'].includes(el.tagName)) {
        return el;
      }
      if (el === document.body) {
        return null;
      }
    }
    return null;
  }

  pointermoveHandler = (e: MouseEvent) => {
    if (this.dragging) return;
    // when pointerdown to select mutiple line. if move on resizer will get wrong selection
    const tableSelection = this.tableModule.getModule<TableSelection>(tableUpInternal.tableSelectionName);
    if (tableSelection?.dragging) return;
    const tableCell = this.findTableCell(e);
    if (!tableCell) {
      return this.hide();
    }
    const tableCellBlot = Quill.find(tableCell) as TableCellFormat;
    if (!tableCellBlot) return;
    if (this.currentTableCell !== tableCell) {
      this.show();
      this.currentTableCell = tableCell;
      this.tableCellBlot = tableCellBlot;
      this.tableBlot = findParentBlot(tableCellBlot, blotName.tableMain);
      if (this.tableBlot.getCols().length > 0) {
        this.updateColResizer();
      }
      this.updateRowResizer();
      addScrollEvent.call(this, this.quill.root, () => {
        if (this.dragging) return;
        this.hideResizer();
      });
    }
  };

  findDragColIndex(cols: TableColFormat[]) {
    if (!this.tableCellBlot) return -1;
    return cols.findIndex(col => col.colId === this.tableCellBlot!.colId);
  }

  updateColResizer() {
    if (!this.tableBlot || !this.tableCellBlot || !this.colResizer) return;
    this.colResizer.remove();
    const { rect: tableRect } = getTableMainRect(this.tableBlot);
    if (!tableRect) return;
    this.colResizer = this.tableModule.addContainer(this.bem.be('col'));
    const tableCellRect = this.tableCellBlot.domNode.getBoundingClientRect();
    const rootRect = this.quill.root.getBoundingClientRect();
    let left = tableCellRect.right - rootRect.x;
    if (isTableAlignRight(this.tableBlot)) {
      left = tableCellRect.left - rootRect.x;
    }
    Object.assign(this.colResizer.style, {
      top: `${tableRect.y - rootRect.y}px`,
      left: `${left}px`,
      height: `${tableRect.height}px`,
    });

    const { stop } = dragElement(this.colResizer, {
      axis: 'x',
      onStart: (position, e) => {
        this.dragging = true;

        this.calculateColDragRange();
        this.dragXCommon.createBreak();
        if (!this.tableBlot) return;
        const tableWrapperRect = this.tableBlot.domNode.parentElement!.getBoundingClientRect();
        const { rect: tableRect } = getTableMainRect(this.tableBlot);
        if (!tableRect) return;
        // record current tablb rect to calculate the offset if have scroll when dragging
        this.dragXCommon.startValue = tableRect.x;
        const rootRect = this.quill.root.getBoundingClientRect();
        Object.assign(this.dragXCommon.dragBreak!.style, {
          top: `${Math.max(tableWrapperRect.y, tableRect.y) - rootRect.y}px`,
          left: `${e.clientX - rootRect.x}px`,
          height: `${Math.min(tableWrapperRect.height, tableRect.height)}px`,
        });
      },
      onMove: ({ position }) => {
        if (!this.dragXCommon.dragBreak) return;
        const resultX = this.dragXCommon.limitRange(this.tableBlot, position.x, true);
        const rootRect = this.quill.root.getBoundingClientRect();
        this.dragXCommon.dragBreak.style.left = `${resultX - rootRect.x}px`;
      },
      onEnd: ({ position }) => {
        this.dragging = false;
        // update the resizer position to the final position
        if (this.colResizer) {
          const resultX = this.dragXCommon.limitRange(this.tableBlot, position.x, true);
          const rootRect = this.quill.root.getBoundingClientRect();
          this.colResizer.style.left = `${resultX - rootRect.x}px`;
        }

        this.updateTableCol(position.x);
        this.removeBreak();
      },
    });
    if (this.stopColDrag) this.stopColDrag();
    this.stopColDrag = stop;

    this.colResizer.addEventListener('dragstart', e => e.preventDefault());
  }

  findDragRowIndex(rows: TableRowFormat[]) {
    if (!this.tableCellBlot) return -1;
    const currentRow = this.tableCellBlot.parent;
    if (!(currentRow instanceof TableRowFormat)) return -1;
    return rows.indexOf(currentRow);
  }

  updateRowResizer() {
    if (!this.tableBlot || !this.tableCellBlot || !this.rowResizer) return;
    const tableCellBlot = this.tableCellBlot;
    this.rowResizer.remove();
    const { rect } = getTableMainRect(this.tableBlot);
    if (!rect) return;
    this.rowResizer = this.tableModule.addContainer(this.bem.be('row'));
    const tableCellRect = tableCellBlot.domNode.getBoundingClientRect();
    const rootRect = this.quill.root.getBoundingClientRect();
    Object.assign(this.rowResizer.style, {
      top: `${tableCellRect.bottom - rootRect.y}px`,
      left: `${rect.x - rootRect.x}px`,
      width: `${rect.width}px`,
    });

    const { stop } = dragElement(this.rowResizer, {
      axis: 'y',
      onStart: (position, e) => {
        this.dragging = true;

        this.calculateRowDragRange();
        this.dragYCommon.createBreak();
        if (!this.tableBlot) return;
        const tableWrapperRect = this.tableBlot.domNode.parentElement!.getBoundingClientRect();
        const { rect: tableRect } = getTableMainRect(this.tableBlot);
        if (!tableRect) return;
        // record current tablb rect to calculate the offset if have scroll when dragging
        this.dragYCommon.startValue = tableRect.y;
        const rootRect = this.quill.root.getBoundingClientRect();
        Object.assign(this.dragYCommon.dragBreak!.style, {
          top: `${e.clientY - rootRect.y}px`,
          left: `${Math.max(tableWrapperRect.x, tableRect.x) - rootRect.x}px`,
          width: `${Math.min(tableWrapperRect.width, tableRect.width)}px`,
        });
      },
      onMove: ({ position }) => {
        if (!this.dragYCommon.dragBreak || !this.table) return;
        const resultY = this.dragYCommon.limitRange(this.tableBlot, position.y, true);
        const rootRect = this.quill.root.getBoundingClientRect();
        this.dragYCommon.dragBreak.style.top = `${resultY - rootRect.y}px`;
      },
      onEnd: ({ position }) => {
        this.dragging = false;
        // update the resizer position to the final position
        if (this.rowResizer) {
          const resultY = this.dragYCommon.limitRange(this.tableBlot, position.y, true);
          const rootRect = this.quill.root.getBoundingClientRect();
          this.rowResizer.style.left = `${resultY - rootRect.y}px`;
        }

        this.updateTableRow(position.y);
        this.removeBreak();
      },
    });
    if (this.stopRowDrag) this.stopRowDrag();
    this.stopRowDrag = stop;

    this.rowResizer.addEventListener('dragstart', e => e.preventDefault());
  }

  show() {
    if (!this.table || !this.rowResizer || !this.colResizer) return;
    this.rowResizer.classList.remove(this.bem.is('hidden'));
    this.colResizer.classList.remove(this.bem.is('hidden'));
    this.table.addEventListener('pointermove', this.pointermoveHandler);
  }

  hideResizer() {
    if (!this.rowResizer || !this.colResizer) return;
    this.rowResizer.classList.add(this.bem.is('hidden'));
    this.colResizer.classList.add(this.bem.is('hidden'));
  }

  hide() {
    this.currentTableCell = undefined;
    clearScrollEvent.call(this);
    this.hideResizer();
    if (!this.table) return;
    this.table.removeEventListener('pointermove', this.pointermoveHandler);
  }

  destroy() {
    super.destroy();
    if (this.colResizer) {
      this.colResizer.remove();
      this.colResizer = undefined;
    }
    if (this.rowResizer) {
      this.rowResizer.remove();
      this.rowResizer = undefined;
    }
    this.quill.off(Quill.events.EDITOR_CHANGE, this.updateWhenTextChange);
  }
}

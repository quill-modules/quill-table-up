import type TypeScroll from 'quill/blots/scroll';
import type { TableValue } from '../utils';
import type { TableBodyFormat } from './table-body-format';
import { blotName, randomId, tableUpSize } from '../utils';
import { ContainerFormat } from './container-format';
import { TableCellFormat } from './table-cell-format';
import { TableCellInnerFormat } from './table-cell-inner-format';
import { TableColFormat } from './table-col-format';
import { TableRowFormat } from './table-row-format';

export class TableMainFormat extends ContainerFormat {
  static blotName = blotName.tableMain;
  static tagName = 'table';
  static className = 'ql-table';

  static create(value: TableValue) {
    const node = super.create() as HTMLElement;
    const { tableId, full, align } = value;
    node.dataset.tableId = tableId;
    if (align === 'right' || align === 'center') {
      node.dataset.align = align;
    }
    else {
      node.removeAttribute('date-align');
    }
    full && (node.dataset.full = String(full));
    node.setAttribute('cellpadding', '0');
    node.setAttribute('cellspacing', '0');
    return node;
  }

  constructor(public scroll: TypeScroll, domNode: HTMLElement, _value: unknown) {
    super(scroll, domNode);
    this.updateAlign();
  }

  colWidthFillTable() {
    if (this.full) {
      Object.assign(this.domNode.style, { width: null });
      return;
    }
    const cols = this.getCols();
    if (!cols) return;
    const colsWidth = cols.reduce((sum, col) => col.width + sum, 0);
    if (colsWidth === 0 || Number.isNaN(colsWidth)) return;
    this.domNode.style.width = `${colsWidth}px`;
    return colsWidth;
  }

  get tableId() {
    return this.domNode.dataset.tableId!;
  }

  get full() {
    return Object.hasOwn(this.domNode.dataset, 'full');
  }

  set full(value: boolean) {
    if (value) {
      this.domNode.dataset.full = String(true);
    }
    else {
      this.domNode.removeAttribute('data-full');
    }
    this.colWidthFillTable();
  }

  get align() {
    return this.domNode.dataset.align || '';
  }

  set align(value: string) {
    if (value === 'right' || value === 'center') {
      this.domNode.dataset.align = value;
    }
    else {
      this.domNode.removeAttribute('data-align');
    }
    this.updateAlign();
  }

  get freezeRow() {
    const cols = this.getCols();
    let max = 0;
    for (const col of cols) {
      if (col.freezeRow > max) max = col.freezeRow;
    }
    return max;
  }

  setFreezeRow(value: number) {
    const cols = this.getCols();
    for (const col of cols) {
      col.freezeRow = value;
    }
    this.updateFreezeRows();
  }

  updateFreezeRows(animate: boolean = false) {
    const rows = this.getRows();
    const freezeRow = this.freezeRow;
    let top = 0;
    for (const [i, row] of rows.entries()) {
      const node = row.domNode;
      if (i < freezeRow) {
        node.classList.add('is-frozen');
        node.classList.toggle('is-frozen-animate', animate);
        node.style.top = `${top}px`;
        top += node.getBoundingClientRect().height;
      }
      else {
        node.classList.remove('is-frozen', 'is-frozen-animate');
        node.style.top = '';
      }
    }
  }

  get freezeCol() {
    const cols = this.getCols();
    let max = 0;
    for (const col of cols) {
      if (col.freezeCol > max) max = col.freezeCol;
    }
    return max;
  }

  setFreezeCol(value: number) {
    const cols = this.getCols();
    for (const col of cols) {
      col.freezeCol = value;
    }
    this.updateFreezeCols();
  }

  updateFreezeCols() {
    const cols = this.getCols();
    const freezeCol = this.freezeCol;
    const colLefts = new Map<string, number>();
    // `full` tables store `TableColFormat.width` as a percentage, not a pixel
    // value, so it must be scaled by the table's actual rendered width before
    // accumulating cascading offsets. Measure once per call to keep this cheap.
    const tableWidth = this.full ? this.domNode.getBoundingClientRect().width : 0;
    let left = 0;
    for (const [i, col] of cols.entries()) {
      if (i < freezeCol) {
        colLefts.set(col.colId, left);
        left += this.full ? (col.width / 100 * tableWidth) : col.width;
      }
    }
    for (const cell of this.descendants(TableCellFormat)) {
      const node = cell.domNode;
      const cellLeft = colLefts.get(cell.colId);
      if (cellLeft !== undefined) {
        node.classList.add('is-frozen-col');
        node.style.left = `${cellLeft}px`;
      }
      else {
        node.classList.remove('is-frozen-col');
        node.style.left = '';
      }
    }
  }

  setFull() {
    if (this.full) return;
    const cols = this.getCols();
    if (cols.length === 0) return;
    const tableWidth = Math.floor(this.domNode.getBoundingClientRect().width);
    for (const col of cols) {
      const value = col.width / tableWidth * 100;
      col.full = true;
      col.width = value;
    }
  }

  cancelFull() {
    if (!this.full) return;
    const cols = this.getCols();
    if (cols.length === 0) return;
    const tableWidth = Math.floor(this.domNode.getBoundingClientRect().width);
    for (const col of cols) {
      col.full = false;
      col.width = Math.max(col.width / 100 * tableWidth, tableUpSize.colMinWidthPx);
    }
  }

  updateAlign() {
    const value = this.align;
    const style: Record<string, string | null> = {
      marginLeft: null,
      marginRight: null,
    };
    switch (value) {
      case 'center': {
        style.marginLeft = 'auto';
        style.marginRight = 'auto';
        break;
      }
      case '':
      case 'left': {
        style.marginRight = 'auto';
        break;
      }
      case 'right': {
        style.marginLeft = 'auto';
        break;
      }
      default: {
        break;
      }
    }
    Object.assign(this.domNode.style, style);
  }

  getBodys() {
    return Array.from(this.domNode.querySelectorAll('thead, tbody, tfoot'))
      .map(el => this.scroll.find(el) as TableBodyFormat)
      .filter(Boolean);
  }

  getRows() {
    return Array.from(this.domNode.querySelectorAll('tr'))
      .map(el => this.scroll.find(el) as TableRowFormat)
      .filter(Boolean);
  }

  getRowIds() {
    return this.getRows().map(d => d.rowId);
  }

  getCols() {
    return this.descendants(TableColFormat);
  }

  getColIds() {
    return this.getCols().map(d => d.colId);
  }

  checkMerge(): boolean {
    const next = this.next;
    return (
      next !== null
      && next.statics.blotName === this.statics.blotName
      && next.domNode.dataset.tableId === this.tableId
    );
  }

  optimize(context: Record<string, any>) {
    const parent = this.parent;
    if (parent !== null && parent.statics.blotName !== blotName.tableWrapper) {
      this.wrap(blotName.tableWrapper, this.tableId);
    }

    super.optimize(context);
    this.mergeRow();
  }

  // ensure row id unique in same table
  mergeRow() {
    if (!this.parent) return;
    const rows = this.getRows();
    const rowGroup: Record<string, TableRowFormat[]> = {};
    for (const row of rows) {
      if (!rowGroup[row.rowId]) rowGroup[row.rowId] = [];
      rowGroup[row.rowId].push(row);
    }

    for (const rowList of Object.values(rowGroup)) {
      for (let i = 1; i < rowList.length; i++) {
        const row = rowList[i];
        row.moveChildren(rowList[0]);
        row.remove();
      }
    }
  }

  checkEmptyCol(autoMerge: boolean) {
    if (autoMerge) {
      const rowCount = this.getRows().length;
      const cols = this.getCols();
      const cells = this.descendants(TableCellInnerFormat);
      for (const cell of cells) {
        if (cell.colspan > 1 && cell.rowspan >= rowCount) {
          const index = cols.findIndex(col => col.colId === cell.colId);
          const currentCol = cols[index];
          for (let i = index + 1; i < index + cell.colspan; i++) {
            cols[i].remove();
            currentCol.width += cols[i].width;
          }
          cell.colspan = 1;
        }
      }
    }
  }

  checkEmptyRow(autoMerge: boolean) {
    const rows = this.getRows();
    const rowIds = new Set(rows.map(row => row.rowId));
    for (let i = rows.length - 1; i >= 0; i--) {
      const row = rows[i];
      if (autoMerge) {
        // reduce rowspan previou row
        if (row.children.length === 0) {
          for (let gap = 1, j = i - 1; j >= 0; j--, gap++) {
            const prev = rows[j];
            prev.foreachCellInner((cell) => {
              if (cell.rowspan > gap) {
                cell.rowspan -= 1;
                const emptyRow = new Set(cell.emptyRow);
                emptyRow.delete(row.rowId);
                cell.emptyRow = Array.from(emptyRow);
              }
            });
          }
          row.remove();
        }
      }
      else {
        if (row.children.length === 0 && row.prev) {
          // find the not empty row
          let prev = row.prev as TableRowFormat;
          while (prev?.children.length === 0) {
            prev = prev.prev as TableRowFormat;
          }
          prev.foreachCellInner((cell) => {
            const emptyRowIds = new Set(cell.emptyRow);
            // prevent order change. like currnet emptyRow ['1', '2'] add rowId '2' will be ['2', '1']
            if (!emptyRowIds.has(row.rowId)) {
              // the loop is from back to front, and the rowId should be added to the head
              cell.emptyRow = [row.rowId, ...emptyRowIds];
            }
          });
        }
        row.foreachCellInner((cell) => {
          for (const emptyRow of cell.emptyRow) {
            if (!rowIds.has(emptyRow)) {
              row.parent.insertBefore(this.scroll.create(blotName.tableRow, { tableId: this.tableId, rowId: emptyRow }), row.next);
            }
          }
        });
      }
    }
  }

  sortMergeChildren() {
    // move same type children to the first child
    const childs: Record<string, ContainerFormat[]> = {
      [blotName.tableCaption]: [],
      [blotName.tableColgroup]: [],
      [blotName.tableHead]: [],
      [blotName.tableBody]: [],
      [blotName.tableFoot]: [],
    };
    // eslint-disable-next-line unicorn/no-array-for-each
    this.children.forEach((child) => {
      if (childs[child.statics.blotName]) {
        childs[child.statics.blotName].push(child as ContainerFormat);
      }
    });
    for (const formats of Object.values(childs)) {
      for (let i = 1; i < formats.length; i++) {
        formats[i].moveChildren(formats[0]);
      }
    }

    // check sort child
    const tableCaption = childs[blotName.tableCaption][0];
    const tableColgroup = childs[blotName.tableColgroup][0];
    const tableHead = childs[blotName.tableHead][0];
    const tableBody = childs[blotName.tableBody][0];
    const tableFoot = childs[blotName.tableFoot][0];

    const isCaptionFirst = tableCaption && this.children.head !== tableCaption;
    const isColgroupSecond = tableColgroup && tableCaption && tableCaption.next !== tableColgroup;
    const isColgroupFirst = tableColgroup && !tableCaption && this.children.head !== tableColgroup;
    const isHeadLast = tableHead && !tableBody && !tableFoot && this.children.tail !== tableHead;
    const isBodyAfterHead = tableBody && tableHead && tableBody.prev !== tableHead;
    const isBodyLast = tableBody && !tableFoot && this.children.tail !== tableBody;
    const isBodyBeforeFoot = tableBody && tableFoot && tableBody.next !== tableFoot;
    const isFootLast = tableFoot && this.children.tail !== tableFoot;

    // sort child
    if (isCaptionFirst || isColgroupSecond || isColgroupFirst || isHeadLast || isBodyAfterHead || isBodyLast || isBodyBeforeFoot || isFootLast) {
      const tableMain = this.clone() as TableMainFormat;
      tableCaption && tableMain.appendChild(tableCaption);
      tableColgroup && tableMain.appendChild(tableColgroup);
      tableHead && tableMain.appendChild(tableHead);
      tableBody && tableMain.appendChild(tableBody);
      tableFoot && tableMain.appendChild(tableFoot);

      // eslint-disable-next-line unicorn/no-array-for-each
      this.children.forEach(child => child.remove());
      tableMain.moveChildren(this);
    }
  }

  // insert row at index
  insertRow(targetIndex: number) {
    // get all column id. exclude the columns of the target index row with rowspan
    const colIds = this.getColIds();
    const rows = this.descendants(TableRowFormat);
    const insertColIds = new Set(colIds);
    let index = 0;
    for (const row of rows) {
      if (index === targetIndex) break;
      row.foreachCellInner((cell) => {
        if (index + cell.rowspan > targetIndex) {
          cell.rowspan += 1;
          insertColIds.delete(cell.colId);
          // colspan cell need remove all includes colId
          if (cell.colspan !== 1) {
            const colIndex = colIds.indexOf(cell.colId);
            for (let i = 0; i < cell.colspan - 1; i++) {
              insertColIds.delete(colIds[colIndex + i + 1]);
            }
          }
        }
      });
      index += 1;
    }
    // append new row
    const tableId = this.tableId;
    const rowId = randomId();
    const tableRow = this.scroll.create(blotName.tableRow, {
      tableId,
      rowId,
    }) as ContainerFormat;
    for (const colId of insertColIds) {
      const breakBlot = this.scroll.create('break');
      const block = breakBlot.wrap('block');
      const tableCellInner = block.wrap(blotName.tableCellInner, {
        tableId,
        rowId,
        colId,
        rowspan: 1,
        colspan: 1,
      });
      const tableCell = tableCellInner.wrap(blotName.tableCell, {
        tableId,
        rowId,
        colId,
        rowspan: 1,
        colspan: 1,
      });
      tableRow.appendChild(tableCell);
    }

    // insert the new row at the target index
    // if you insert a row at the thead, then the new row will be inserted in thead. Similarly for tbody and tfoot
    const refRow = rows[targetIndex] || null;
    if (!refRow) {
      rows[rows.length - 1].parent.appendChild(tableRow);
    }
    else {
      refRow.parent.insertBefore(tableRow, refRow);
    }
  }
}

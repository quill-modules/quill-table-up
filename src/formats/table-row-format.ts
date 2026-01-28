import type { Parchment as TypeParchment } from 'quill';
import type { TableBodyTag, TableCellValue, TableRowValue } from '../utils';
import type { TableCellFormat } from './table-cell-format';
import { blotName, findParentBlot } from '../utils';
import { ContainerFormat } from './container-format';
import { TableCellInnerFormat } from './table-cell-inner-format';

export type SkipRowCount = number[] & { skipRowNum?: number };
export class TableRowFormat extends ContainerFormat {
  static blotName = blotName.tableRow;
  static tagName = 'tr';
  static className = 'ql-table-row';
  static allowDataAttrs = new Set(['table-id', 'row-id', 'wrap-tag']);
  static allowDataAttrsChangeHandler: Record<string, keyof TableRowFormat> = {
    'wrap-tag': 'wrapParentTag',
  };

  static create(value: TableRowValue) {
    const {
      tableId,
      rowId,
      wrapTag = 'tbody',
    } = value;
    const node = super.create() as HTMLElement;
    node.dataset.tableId = tableId;
    node.dataset.rowId = rowId;
    node.dataset.wrapTag = wrapTag;
    return node;
  }

  declare children: TypeParchment.LinkedList<TableCellFormat>;

  get rowId() {
    return this.domNode.dataset.rowId!;
  }

  get tableId() {
    return this.domNode.dataset.tableId!;
  }

  get wrapTag() {
    return this.domNode.dataset.wrapTag as TableBodyTag || 'tbody';
  }

  setHeight(value: string) {
    this.foreachCellInner((cellInner) => {
      cellInner.setFormatValue('height', value, true);
    });
  }

  getCellByColId(colId: string, direction: 'next' | 'prev'): TableCellFormat | null {
    const tableMain = findParentBlot(this, blotName.tableMain);
    const colIds = tableMain.getColIds();
    const targetIndex = colIds.indexOf(colId);
    const next = this.children.iterator();
    let cur: null | TableCellFormat = null;
    while ((cur = next())) {
      if (cur.colId === colId) {
        return cur;
      }
      const curIndex = colIds.indexOf(cur.colId);
      if (curIndex < targetIndex && curIndex + cur.colspan > targetIndex) {
        return cur;
      }
    }
    // Not found in current row. Means cell is rowspan. Find in prev or next row.
    if (this[direction] && this[direction]!.statics.blotName === blotName.tableRow) {
      return (this[direction] as TableRowFormat).getCellByColId(colId, direction);
    }
    return null;
  }

  // insert cell at index
  // return the minus skip column number
  // [2, 3]. means next line should skip 2 columns. next next line skip 3 columns
  insertCell(targetIndex: number, value: TableCellValue) {
    const skip: SkipRowCount = [];
    const next = this.children.iterator();
    let index = 0;
    let cur;
    while ((cur = next())) {
      index += cur.colspan;
      if (index > targetIndex) break;
      if (cur.rowspan !== 1) {
        for (let i = 0; i < cur.rowspan - 1; i++) {
          skip[i] = (skip[i] || 0) + cur.colspan;
        }
      }
    }

    if (cur && index - cur.colspan < targetIndex) {
      const tableCell = cur.getCellInner();
      tableCell.colspan += 1;
      if (cur.rowspan !== 1) {
        skip.skipRowNum = cur.rowspan - 1;
      }
    }
    else {
      const tableCell = this.scroll.create(blotName.tableCell, value) as ContainerFormat;
      const tableCellInner = this.scroll.create(blotName.tableCellInner, value) as ContainerFormat;
      const block = this.scroll.create('block') as TypeParchment.BlockBlot;
      block.appendChild(this.scroll.create('break'));
      tableCellInner.appendChild(block);
      tableCell.appendChild(tableCellInner);
      this.insertBefore(tableCell, cur);
    }
    return skip;
  }

  getCellByColumIndex(stopIndex: number): [null | TableCellFormat, number, number[]] {
    const skip: number[] = [];
    let cur: null | TableCellFormat = null;
    let cellEndIndex = 0;
    if (stopIndex < 0) return [cur, cellEndIndex, skip];
    const next = this.children.iterator();
    while ((cur = next())) {
      cellEndIndex += cur.colspan;
      if (cur.rowspan !== 1) {
        for (let i = 0; i < cur.rowspan - 1; i++) {
          skip[i] = (skip[i] || 0) + cur.colspan;
        }
      }
      if (cellEndIndex > stopIndex) break;
    }
    return [cur, cellEndIndex, skip];
  }

  removeCell(targetIndex: number): SkipRowCount {
    if (targetIndex < 0) return [];
    const columnIndexData = this.getCellByColumIndex(targetIndex);
    const [cur, index] = columnIndexData;
    const skip: SkipRowCount = columnIndexData[2];
    if (!cur) return skip;
    if (index - cur.colspan < targetIndex || cur.colspan > 1) {
      const [tableCell] = cur.descendants(TableCellInnerFormat);

      if (cur.colspan !== 1 && targetIndex === index - cur.colspan) {
        // if delete index is cell start index. update cell colId to next colId
        const tableBlot = findParentBlot(this, blotName.tableMain);
        const colIds = tableBlot.getColIds();
        tableCell.colId = colIds[colIds.indexOf(tableCell.colId) + 1];
      }
      if (cur.rowspan !== 1) {
        skip.skipRowNum = cur.rowspan - 1;
      }

      tableCell.colspan -= 1;
    }
    else {
      cur.remove();
    }
    return skip;
  }

  foreachCellInner(func: (tableCell: TableCellInnerFormat, index: number) => boolean | void) {
    const next = this.children.iterator();
    let i = 0;
    let cur: TableCellFormat | null;
    while ((cur = next())) {
      const [tableCell] = cur.descendants(TableCellInnerFormat);
      if (tableCell && func(tableCell, i++)) break;
    }
  }

  checkMerge(): boolean {
    const next = this.next as TableRowFormat;
    return (
      next !== null
      && next.statics.blotName === this.statics.blotName
      && next.rowId === this.rowId
    );
  }

  wrapParentTag() {
    const tableBodyBlotNameMap: Record<string, string> = {
      thead: blotName.tableHead,
      tbody: blotName.tableBody,
      tfoot: blotName.tableFoot,
    };

    const parent = this.parent;
    if (parent !== null && parent.statics.blotName !== tableBodyBlotNameMap[this.wrapTag]) {
      if (Object.values(tableBodyBlotNameMap).includes(parent.statics.blotName)) {
        const index = this.offset(this.parent);
        const newParent = this.parent.split(index);
        if (newParent && newParent.length() <= 0) {
          newParent.remove();
        }
        const afterParent = (this.parent as TypeParchment.ParentBlot).splitAfter(this);
        if (afterParent && afterParent.length() <= 0) {
          afterParent.remove();
        }
        this.parent.replaceWith(tableBodyBlotNameMap[this.wrapTag], this.tableId);
      }
      else {
        this.wrap(tableBodyBlotNameMap[this.wrapTag], this.tableId);
      }
    }
  }

  optimize(_context: Record<string, any>) {
    this.wrapParentTag();

    this.enforceAllowedChildren();
    if (this.children.length > 0 && this.next != null && this.checkMerge()) {
      this.next.moveChildren(this);
      this.next.remove();
    }
    // TODO update fixed cell fixed width
  }

  remove() {
    super.remove();
    // remove next empty row
    if (this.next && this.next instanceof TableRowFormat && this.next.length() <= 0) {
      this.next.remove();
    }
  }
}

import type { Parchment as TypeParchment } from 'quill';
import type { TableBodyTag, TableCellValue } from '../utils';
import { blotName, ensureArray, findParentBlot, getInlineStyles, toCamelCase } from '../utils';
import { ContainerFormat } from './container-format';
import { TableBodyFormat } from './table-body-format';
import { TableCellInnerFormat } from './table-cell-inner-format';
import { TableRowFormat } from './table-row-format';
import { fixedValueValidate, getValidCellspan } from './utils';

export class TableCellFormat extends ContainerFormat {
  static blotName = blotName.tableCell;
  static tagName = 'td';
  static className = 'ql-table-cell';
  static allowAttrs = new Set(['rowspan', 'colspan']);
  static allowDataAttrs = new Set(['table-id', 'row-id', 'col-id', 'empty-row', 'wrap-tag', 'fixed']);

  // keep `isAllowStyle` and `allowStyle` same with TableCellInnerFormat
  static allowStyle = new Set(['background-color', 'border', 'height']);
  static isAllowStyle(str: string): boolean {
    const cssAttrName = toCamelCase(str);
    for (const style of this.allowStyle) {
      // cause `cssTextToObject` will transform css string to camel case style name
      if (cssAttrName.startsWith(toCamelCase(style))) {
        return true;
      }
    }
    return false;
  }

  static create(value: TableCellValue) {
    const {
      tableId,
      rowId,
      colId,
      rowspan,
      colspan,
      style,
      emptyRow,
      tag = 'td',
      wrapTag = 'tbody',
      fixed,
    } = value;
    const node = document.createElement(tag);
    node.classList.add(...ensureArray(this.className));
    node.dataset.tableId = tableId;
    node.dataset.rowId = rowId;
    node.dataset.colId = colId;
    node.dataset.wrapTag = wrapTag;
    node.setAttribute('rowspan', String(getValidCellspan(rowspan)));
    node.setAttribute('colspan', String(getValidCellspan(colspan)));
    style && (node.style.cssText = style);
    try {
      emptyRow && (node.dataset.emptyRow = JSON.stringify(emptyRow));
    }
    catch {}
    if (fixedValueValidate(fixed)) {
      node.dataset.fixed = fixed;
    }
    return node;
  }

  static formats(domNode: HTMLElement) {
    const {
      tableId,
      rowId,
      colId,
      emptyRow,
      wrapTag = 'tbody',
      fixed,
    } = domNode.dataset;
    const rowspan = Number(domNode.getAttribute('rowspan'));
    const colspan = Number(domNode.getAttribute('colspan'));
    const value: Record<string, any> = {
      tableId,
      rowId,
      colId,
      rowspan: getValidCellspan(rowspan),
      colspan: getValidCellspan(colspan),
      tag: domNode.tagName.toLowerCase(),
      wrapTag,
    };

    const inlineStyles = getInlineStyles(domNode);
    const entries = Object.entries(inlineStyles).filter(([, value]) => {
      return !['initial', 'inherit'].includes(value);
    });
    if (entries.length > 0) {
      value.style = entries.map(([key, value]) => `${key}: ${value}`).join(';');
    }
    try {
      emptyRow && (value.emptyRow = JSON.parse(emptyRow));
    }
    catch {}
    if (fixedValueValidate(fixed)) {
      value.fixed = fixed;
    }
    return value;
  }

  isChildHeadTableCellInner() {
    const headChild = this.children.head;
    return headChild && headChild.statics.blotName === blotName.tableCellInner;
  }

  setFormatValue(name: string, value?: any) {
    if (this.statics.allowAttrs.has(name) || this.statics.allowDataAttrs.has(name)) {
      let attrName = name;
      if (this.statics.allowDataAttrs.has(name)) {
        attrName = `data-${name}`;
      }
      if (value) {
        this.domNode.setAttribute(attrName, value);
      }
      else {
        this.domNode.removeAttribute(attrName);
      }
    }
    else if (this.statics.isAllowStyle(name)) {
      Object.assign(this.domNode.style, {
        [name]: value,
      });
      if (name.startsWith('border')) {
        this.setStyleBoder(name, value);
      }
    }

    const headChild = this.children.head!;
    if (
      this.isChildHeadTableCellInner()
      && this.domNode.style.cssText
      // only update if data not match. avoid optimize circular updates
      && this.domNode.style.cssText !== (headChild.domNode as HTMLElement).dataset.style
    ) {
      (headChild.domNode as HTMLElement).dataset.style = this.domNode.style.cssText;
    }

    if (this.parent && this.parent.statics.blotName === blotName.tableRow) {
      (this.parent as TableRowFormat).setFormatValue(name, value);
    }
  }

  setStyleBoder(name: string, value?: any) {
    // eslint-disable-next-line no-extra-boolean-cast
    const setValue = Boolean(value) ? value : null;
    const isMergeBorder = !['left', 'right', 'top', 'bottom'].some(direction => name.includes(direction)) && name.startsWith('border-');
    if (!isMergeBorder) return;

    const leftCellInners = this.getNearByCell('left').map(td => td.descendant(TableCellInnerFormat, 0)[0]).filter(Boolean) as TableCellInnerFormat[];
    for (const cell of leftCellInners) {
      cell.setFormatValue(name.replace('border-', 'border-right-'), setValue, true);
    }
    const topCellInners = this.getNearByCell('top').map(td => td.descendant(TableCellInnerFormat, 0)[0]).filter(Boolean) as TableCellInnerFormat[];
    for (const cell of topCellInners) {
      cell.setFormatValue(name.replace('border-', 'border-bottom-'), setValue, true);
    }
  }

  getNearByCell(direction: 'left' | 'top'): TableCellFormat[] {
    const colIds: string[] = [];
    try {
      const tableMain = findParentBlot(this, blotName.tableMain);
      colIds.push(...tableMain.getColIds());
    }
    catch (error) {
      console.error(`Cell is not in table! ${error}`);
    }
    if (colIds.length === 0) return [];

    if (direction === 'left') {
      const nearByCell = new Set<TableCellFormat>();
      let row = this.parent;
      for (let i = 0; i < this.rowspan; i++) {
        if (!(row instanceof TableRowFormat)) break;
        const next = row.children.iterator();
        let cur: null | TableCellFormat = null;
        while ((cur = next())) {
          const i = colIds.indexOf(cur.colId) + cur.colspan;
          if (this.colId === colIds[i]) {
            nearByCell.add(cur);
          }
        }
        row = row.next as TableRowFormat;
      }
      return Array.from(nearByCell);
    }
    else if (direction === 'top') {
      if (!(this.parent instanceof TableRowFormat) || !this.parent.prev) return [];
      const nearByCell = new Set<TableCellFormat>();

      const startColIndex = this.getColumnIndex();
      const endColIndex = startColIndex + this.colspan;
      const borderColIds = new Set(colIds.filter((_, i) => i >= startColIndex && i < endColIndex));

      let rowspan = 1;
      let row = this.parent.prev as TableRowFormat;
      while (row) {
        let trReachCurrent = false;
        const next = row.children.iterator();
        let cur: null | TableCellFormat = null;
        let colspan = 0;
        while ((cur = next())) {
          if (borderColIds.has(cur.colId) && cur.rowspan >= rowspan) {
            nearByCell.add(cur);
            borderColIds.delete(cur.colId);
          }
          colspan += cur.colspan;
          cur.rowspan >= rowspan && (trReachCurrent = true);
        }
        if (!trReachCurrent && colspan === colIds.length) break;
        row = row.prev as TableRowFormat;
        rowspan += 1;
      }
      return Array.from(nearByCell);
    }
    return [];
  }

  get tableId() {
    return this.domNode.dataset.tableId!;
  }

  get rowId() {
    return this.domNode.dataset.rowId!;
  }

  get colId() {
    return this.domNode.dataset.colId!;
  }

  get rowspan() {
    return Number(this.domNode.getAttribute('rowspan'));
  }

  get colspan() {
    return Number(this.domNode.getAttribute('colspan'));
  }

  get emptyRow(): string[] {
    try {
      return JSON.parse(this.domNode.dataset.emptyRow!);
    }
    catch {
      return [];
    }
  }

  get wrapTag() {
    return this.domNode.dataset.wrapTag as TableBodyTag || 'tbody';
  }

  get fixed() {
    const value = this.domNode.dataset.fixed;
    if (fixedValueValidate(value)) {
      return value as TableCellValue['fixed'];
    }
    return null;
  }

  getColumnIndex() {
    const table = findParentBlot(this, blotName.tableMain);
    return table.getColIds().indexOf(this.colId);
  }

  getCellInner() {
    return this.children.head as TableCellInnerFormat;
  }

  convertTableCell() {
    const value = this.statics.formats(this.domNode);
    const tag = value.tag === 'td' ? 'th' : 'td';

    const headChild = this.children.head!;
    if (
      this.isChildHeadTableCellInner()
      // only update if data not match. avoid optimize circular updates
      && (headChild.domNode as HTMLElement).dataset.tag !== tag
    ) {
      (headChild.domNode as HTMLElement).dataset.tag = tag;
    }

    this.replaceWith(blotName.tableCell, {
      ...value,
      tag,
    });
  }

  checkMerge(): boolean {
    const { colId, rowId, colspan, rowspan } = this;
    const next = this.next as TableCellFormat;
    return (
      next !== null
      && next.statics.blotName === this.statics.blotName
      && next.rowId === rowId
      && next.colId === colId
      && next.colspan === colspan
      && next.rowspan === rowspan
    );
  }

  optimize(context: Record<string, any>) {
    const { tableId, rowId, wrapTag } = this;
    if (this.parent !== null && this.parent.statics.blotName !== blotName.tableRow) {
      this.wrap(blotName.tableRow, { tableId, rowId, wrapTag });
    }
    // when `replaceWith` called to replace cell. wrapTag may change. so row wrapTag also need to update
    if (this.parent.statics.blotName === blotName.tableRow && (this.parent as TableRowFormat).wrapTag !== wrapTag) {
      (this.parent as TableRowFormat).setFormatValue('wrap-tag', wrapTag);
    }

    if (this.emptyRow.length > 0) {
      const tableBody = this.parent.parent;
      if (tableBody instanceof TableBodyFormat) {
        let insertBefore: TypeParchment.Blot | null = this.parent.next;
        for (const rowId of this.emptyRow) {
          const row = this.scroll.create(blotName.tableRow, { tableId, rowId, wrapTag }) as TableRowFormat;
          tableBody.insertBefore(row, insertBefore);
          insertBefore = row.next;
        }
      }
    }

    super.optimize(context);
  }
}

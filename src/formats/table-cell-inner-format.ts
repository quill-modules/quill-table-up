import type { Parchment as TypeParchment } from 'quill';
import type TypeBlock from 'quill/blots/block';
import type { BlockEmbed as TypeBlockEmbed } from 'quill/blots/block';
import type TypeScroll from 'quill/blots/scroll';
import type { TableBodyTag, TableCellValue } from '../utils';
import type { TableCellFormat } from './table-cell-format';
import Quill from 'quill';
import { blotName, cssTextToObject, findParentBlot, findParentBlots, toCamelCase } from '../utils';
import { ContainerFormat } from './container-format';
import { TableBodyFormat } from './table-body-format';
import { fixedValueValidate, getValidCellspan, isSameCellValue } from './utils';

const Block = Quill.import('blots/block') as TypeParchment.BlotConstructor;
const BlockEmbed = Quill.import('blots/block/embed') as typeof TypeBlockEmbed;

export class TableCellInnerFormat extends ContainerFormat {
  static blotName = blotName.tableCellInner;
  static tagName = 'div';
  static className = 'ql-table-cell-inner';
  static allowDataAttrs: Set<string> = new Set(['table-id', 'row-id', 'col-id', 'rowspan', 'colspan', 'empty-row', 'wrap-tag', 'fixed']);
  static defaultChild: TypeParchment.BlotConstructor = Block;
  declare parent: TableCellFormat;
  // keep `isAllowStyle` and `allowStyle` same with TableCellFormat
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
    const node = super.create() as HTMLElement;
    node.dataset.tableId = tableId;
    node.dataset.rowId = rowId;
    node.dataset.colId = colId;
    node.dataset.rowspan = String(getValidCellspan(rowspan));
    node.dataset.colspan = String(getValidCellspan(colspan));
    node.dataset.tag = tag;
    node.dataset.wrapTag = wrapTag;
    style && (node.dataset.style = style);
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
      rowspan,
      colspan,
      style,
      emptyRow,
      tag = 'td',
      wrapTag = 'tbody',
      fixed,
    } = domNode.dataset;
    const value: Record<string, any> = {
      tableId: String(tableId),
      rowId: String(rowId),
      colId: String(colId),
      rowspan: Number(getValidCellspan(rowspan)),
      colspan: Number(getValidCellspan(colspan)),
      tag,
      wrapTag,
    };
    style && (value.style = style);
    try {
      emptyRow && (value.emptyRow = JSON.parse(emptyRow));
    }
    catch {}
    if (fixedValueValidate(fixed)) {
      value.fixed = fixed;
    }
    return value;
  }

  constructor(scroll: TypeScroll, domNode: HTMLElement, _value: TableCellValue) {
    super(scroll, domNode);
    domNode.setAttribute('contenteditable', String(scroll.isEnabled()));
  }

  setFormatValue(name: string, value?: any, isStyle: boolean = false) {
    if (isStyle) {
      if (!this.statics.isAllowStyle(name)) return;
    }
    else {
      super.setFormatValue(name, value);
    }
    if (this.parent && this.parent.statics.blotName === blotName.tableCell) {
      this.parent.setFormatValue(name, value);
    }

    this.clearCache();
  }

  clearCache() {
    const blocks = this.descendants(Block, 0);
    for (const child of blocks) {
      (child as TypeBlock).cache = {};
    }
  }

  get tableId() {
    return this.domNode.dataset.tableId!;
  }

  get rowId() {
    return this.domNode.dataset.rowId!;
  }

  set rowId(value) {
    this.setFormatValue('row-id', value);
  }

  get colId() {
    return this.domNode.dataset.colId!;
  }

  set colId(value) {
    this.setFormatValue('col-id', value);
  }

  get rowspan() {
    return Number(this.domNode.dataset.rowspan);
  }

  set rowspan(value: number) {
    this.setFormatValue('rowspan', value);
  }

  get colspan() {
    return Number(this.domNode.dataset.colspan);
  }

  set colspan(value: number) {
    this.setFormatValue('colspan', value);
  }

  get emptyRow(): string[] {
    try {
      return JSON.parse(this.domNode.dataset.emptyRow!);
    }
    catch {
      return [];
    }
  }

  set emptyRow(value: string[]) {
    // if value same as currentEmptyRow, do nothing
    if (this.emptyRow.toString() === value.toString()) return;

    try {
      if (value.length > 0) {
        this.setFormatValue('empty-row', JSON.stringify(value), false);
      }
      else {
        this.setFormatValue('empty-row', null, false);
      }
    }
    catch {
      this.setFormatValue('empty-row', null, false);
    }
  }

  get wrapTag() {
    return this.domNode.dataset.wrapTag as TableBodyTag || 'tbody';
  }

  set wrapTag(value: TableBodyTag) {
    this.setFormatValue('wrap-tag', value);
  }

  get fixed() {
    const value = this.domNode.dataset.fixed;
    if (fixedValueValidate(value)) {
      return value as TableCellValue['fixed'];
    }
    return null;
  }

  set fixed(value: TableCellValue['fixed'] | null) {
    this.setFormatValue('fixed', fixedValueValidate(value) ? value : null);
  }

  getColumnIndex() {
    const tableBlot = findParentBlot(this, blotName.tableMain);
    return tableBlot.getColIds().indexOf(this.colId);
  }

  getRowIndex() {
    const tableBlot = findParentBlot(this, blotName.tableMain);
    return tableBlot.getRowIds().indexOf(this.rowId);
  }

  getTableBody() {
    let target: TypeParchment.Parent = this.parent;
    while (target && !(target instanceof TableBodyFormat) && target !== this.scroll) {
      target = target.parent;
    }
    if (target === this.scroll) {
      return null;
    }
    return target as TableBodyFormat;
  }

  getTableRow() {
    try {
      return findParentBlot(this, blotName.tableRow);
    }
    catch {
      return null;
    }
  }

  setStyleByString(styleStr: string) {
    const style = cssTextToObject(styleStr);
    for (const [name, value] of Object.entries(style)) {
      this.setFormatValue(name, value, true);
    }
  }

  convertTableCell() {
    if (this.parent.statics.blotName !== blotName.tableCell) return;
    this.parent.convertTableCell();
    this.clearCache();
  }

  formatAt(index: number, length: number, name: string, value: any) {
    if (this.children.length === 0) {
      const defaultChild = this.scroll.create(this.statics.defaultChild.blotName);
      this.appendChild(defaultChild);
      // block min length is 1
      length += defaultChild.length();
    }
    super.formatAt(index, length, name, value);
    // set style for `td`
    if (value?.style) {
      this.setStyleByString(value.style);
    }
  }

  insertAt(index: number, value: string, def?: any): void {
    const [child] = this.children.find(index);
    // always keep TableCellInner not empty
    if (!child && this.statics.defaultChild) {
      const defaultChild = this.scroll.create(this.statics.defaultChild.blotName || 'block');
      this.appendChild(defaultChild);
    }
    super.insertAt(index, value, def);
    // BlockEmbed will have a \n in delta, this will effect history stack
    // so when insert a BlockEmbed, if current child length <= 1 then remove it
    const blot = def == null
      ? this.scroll.create('text', value)
      : this.scroll.create(value, def);
    if (blot instanceof BlockEmbed && child && child.length() <= 1) {
      child.remove();
    }
  }

  formats(): Record<string, any> {
    const value = this.statics.formats(this.domNode);
    return {
      [this.statics.blotName]: value,
    };
  }

  checkMerge(): boolean {
    const { colId, rowId, colspan, rowspan } = this;
    const next = this.next as TableCellInnerFormat;
    return (
      next !== null
      && next.statics.blotName === this.statics.blotName
      && next.rowId === rowId
      && next.colId === colId
      && next.colspan === colspan
      && next.rowspan === rowspan
    );
  }

  optimize() {
    const parent = this.parent;
    const blotValue = this.statics.formats(this.domNode);
    // handle BlockEmbed to insert tableCellInner when setContents
    if (this.prev && this.prev instanceof BlockEmbed) {
      const prev = this.prev;
      this.insertBefore(prev, this.children.head);
      if (this.length() <= 1) {
        const afterBlock = this.scroll.create('block');
        this.insertBefore(afterBlock, prev.next);
      }
    }
    const parentNotTableCell = parent !== null && parent.statics.blotName !== blotName.tableCell;
    if (parentNotTableCell) {
      this.wrap(blotName.tableCell, blotValue);
      // when insert delta like: [ { attributes: { 'table-up-cell-inner': { ... } }, insert: '\n' }, { attributes: { 'table-up-cell-inner': { ... } }, insert: '\n' }, ...]
      // that delta will create dom like: <td><div></div></td>... . that means TableCellInner will be an empty cell without 'block'
      // in this case, a 'block' should to inserted to makesure that the cell will not be remove
      if (this.children.length === 0) {
        const child = this.scroll.create(this.statics.defaultChild.blotName);
        this.appendChild(child);
      }
    }

    if (this.children.length > 0 && this.next != null && this.checkMerge()) {
      this.next.moveChildren(this);
      this.next.remove();
    }
    // TODO: uiNode not test, maybe have bug
    if (this.uiNode != null && this.uiNode !== this.domNode.firstChild) {
      this.domNode.insertBefore(this.uiNode, this.domNode.firstChild);
    }
    // this is necessary when redo or undo. else will delete or insert wrong index
    if (this.children.length === 0) {
      // if cellInner doesn't have child then remove it. not insert a block
      this.remove();
    }
    else {
      // update delta data
      if (
        this.domNode.dataset.style
        && parentNotTableCell
        && parent.domNode.style.cssText !== this.domNode.dataset.style
      ) {
        this.setStyleByString(this.domNode.dataset.style);
      }
    }
  }

  insertBefore(blot: TypeParchment.Blot, ref?: TypeParchment.Blot | null) {
    if (blot.statics.blotName === this.statics.blotName) {
      const cellInnerBlot = blot as TableCellInnerFormat;
      const cellInnerBlotValue = this.statics.formats(cellInnerBlot.domNode);
      const selfValue = this.statics.formats(this.domNode);
      const isSame = isSameCellValue(selfValue, cellInnerBlotValue);

      if (!isSame) {
        const [selfRow, selfCell] = findParentBlots(this, [blotName.tableRow, blotName.tableCell] as const);
        let cellRef: TypeParchment.Blot = selfCell;
        // split current cellInner
        if (ref) {
          const index = ref.offset();
          const length = this.length();
          if (index !== 0 && index < length) {
            const newCellInner = this.split(index)!;
            const newCell = newCellInner.wrap(blotName.tableCell, selfValue);
            selfRow.insertBefore(newCell, selfCell.next);
            cellRef = newCell;
          }
        }
        if (this.tableId !== cellInnerBlot.tableId) {
          const selfTableWrapper = findParentBlot(this, blotName.tableWrapper);
          const index = this.offset(selfTableWrapper);
          const afterSelfTableWrapper = selfTableWrapper.split(index);
          return selfTableWrapper.parent.insertBefore(cellInnerBlot, afterSelfTableWrapper);
        }
        // different rowId. split current row
        if (this.rowId !== cellInnerBlot.rowId) {
          let rowRef: TypeParchment.Blot | null = selfRow;
          const splitRef = ref;
          if (splitRef) {
            const index = splitRef.offset(selfRow);
            rowRef = selfRow.split(index);
          }
          const row = this.scroll.create(blotName.tableRow, cellInnerBlotValue) as TypeParchment.Parent;
          const cell = this.scroll.create(blotName.tableCell, cellInnerBlotValue) as TypeParchment.Parent;
          cell.appendChild(cellInnerBlot);
          row.appendChild(cell);
          return selfRow.parent.insertBefore(row, rowRef);
        }
        return selfRow.insertBefore(
          cellInnerBlot.wrap(blotName.tableCell, cellInnerBlotValue),
          cellRef,
        );
      }
      else {
        const next = this.split(ref ? ref.offset() : 0);
        return this.parent.insertBefore(cellInnerBlot, next);
      }
    }
    else if (blot.statics.blotName === blotName.tableCol) {
      try {
        const bodyBlot = findParentBlot(this, blotName.tableBody);
        const index = this.offset(bodyBlot);
        const next = bodyBlot.split(index);
        bodyBlot.parent.insertBefore(blot, next);
        blot.optimize({});
      }
      catch {
        // here should not trigger
        console.warn('TableCellInner not in TableBody');
      }
      return;
    }
    super.insertBefore(blot, ref);
  }
}

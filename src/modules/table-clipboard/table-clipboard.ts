import type { Parchment as TypeParchment } from 'quill';
import type { Delta as TypeDelta } from 'quill/core';
import type TypeClipboard from 'quill/modules/clipboard';
import type { TableUp } from '../../table-up';
import type { TableCaptionValue, TableCellValue, TableUpOptions } from '../../utils';
import Quill from 'quill';
import { TableCellFormat, TableColFormat } from '../../formats';
import { blotName, cssTextToObject, isObject, isString, objectToCssText, randomId, resolveStyleSheetToInline, tableUpInternal, tableUpSize } from '../../utils';

const Delta = Quill.import('delta');
const Clipboard = Quill.import('modules/clipboard') as typeof TypeClipboard;
export type Selector = string | Node['TEXT_NODE'] | Node['ELEMENT_NODE'];
export type Matcher = (node: Node, delta: TypeDelta, scroll: TypeParchment.ScrollBlot) => TypeDelta;
export interface ClipboardOptions {
  matchers: [Selector, Matcher][];
}

type WidthUnit = 'percent' | 'pixel' | 'unknown';
interface ColWidthMeta {
  unit: WidthUnit;
  width: number | null;
}

function getWidthUnit(value: string): WidthUnit {
  const width = value.trim().toLowerCase();
  if (!width) return 'unknown';
  if (width.endsWith('%')) return 'percent';
  return Number.isNaN(Number.parseFloat(width)) ? 'unknown' : 'pixel';
}

function getRawWidth(el: HTMLElement): string {
  return el.getAttribute('width') || el.style.width || '';
}

function getDefaultColWidth(colNums: number, full: boolean): number {
  return full ? (100 / colNums) : tableUpSize.colDefaultWidth;
}

function getExpandedColWidthMeta(node: HTMLElement): ColWidthMeta[] {
  const result: ColWidthMeta[] = [];
  for (const col of Array.from(node.querySelectorAll('col'))) {
    let span = Number.parseInt(col.getAttribute('span') || '1', 10);
    if (Number.isNaN(span) || span <= 0) span = 1;
    const rawWidth = getRawWidth(col);
    const width = Number.parseFloat(rawWidth);
    const meta = {
      unit: getWidthUnit(rawWidth),
      width: Number.isNaN(width) ? null : width,
    } satisfies ColWidthMeta;
    for (let i = 0; i < span; i++) {
      result.push(meta);
    }
  }
  return result;
}

function inferTableWidth(colWidths: ColWidthMeta[]): number | null {
  let percentWidth = 0;
  let pixelWidth = 0;
  for (const col of colWidths) {
    if (col.unit === 'percent' && col.width != null) {
      percentWidth += col.width;
    }
    else if (col.unit === 'pixel' && col.width != null) {
      pixelWidth += col.width;
    }
  }
  // For mixed colgroups without an explicit table width, infer the total table width
  // from the remaining pixel share after subtracting percentage columns.
  if (pixelWidth <= 0 || percentWidth >= 100) return null;
  return pixelWidth / (1 - percentWidth / 100);
}

function getTableWidth(table: HTMLElement | null, colWidths: ColWidthMeta[]): number | null {
  if (!table) return inferTableWidth(colWidths);
  const rawWidth = getRawWidth(table);
  const parsedWidth = Number.parseFloat(rawWidth);
  if (rawWidth && getWidthUnit(rawWidth) === 'pixel' && !Number.isNaN(parsedWidth)) {
    return parsedWidth;
  }
  if (table.offsetWidth > 0) return table.offsetWidth;
  return inferTableWidth(colWidths);
}

function convertColWidth(
  width: number | null,
  unit: WidthUnit,
  full: boolean,
  tableWidth: number | null,
  colNums: number,
): number {
  const defaultWidth = getDefaultColWidth(colNums, full);
  if (width == null || unit === 'unknown') {
    return defaultWidth;
  }
  if (full) {
    if (unit === 'percent') return width;
    return tableWidth != null ? width / tableWidth * 100 : defaultWidth;
  }
  if (unit === 'pixel') return width;
  return tableWidth != null ? width / 100 * tableWidth : defaultWidth;
}

export class TableClipboard extends Clipboard {
  tableId = randomId();
  rowId = randomId();
  colIds: string[] = [];
  rowspanCount: { rowspan: number; colspan: number }[] = [];
  cellCount = 0;
  colCount = 0;
  constructor(public quill: Quill, options: Partial<ClipboardOptions>) {
    super(quill, options);
    this.addMatcher('table', this.matchTable.bind(this));
    this.addMatcher('thead', this.matchThead.bind(this));
    this.addMatcher('tbody', this.matchTbody.bind(this));
    this.addMatcher('tfoot', this.matchTfoot.bind(this));
    this.addMatcher('colgroup', this.matchColgroup.bind(this));
    this.addMatcher('col', this.matchCol.bind(this));
    this.addMatcher('tr', this.matchTr.bind(this));
    this.addMatcher('td', this.matchTd.bind(this));
    this.addMatcher('th', this.matchTd.bind(this));
    this.addMatcher('caption', this.matchCaption.bind(this));

    this.addMatcher(Node.ELEMENT_NODE, this.matchTdAttributor.bind(this));
  }

  normalizeHTML(doc: Document) {
    super.normalizeHTML(doc);
    const tableModule = this.quill.getModule(tableUpInternal.moduleName) as TableUp | undefined;
    const options: Partial<TableUpOptions> = tableModule?.options ?? {};
    if (options.pasteStyleSheet !== false) {
      resolveStyleSheetToInline(doc, {
        includeDefaultTagStyle: options.pasteDefaultTagStyle,
      });
    }
  }

  getStyleBackgroundColor(node: Node, delta: TypeDelta) {
    const backgroundColor = (node as HTMLElement).style.backgroundColor;
    if (backgroundColor) {
      for (const op of delta.ops) {
        if (op.attributes?.[blotName.tableCellInner]) {
          const { style, ...value } = op.attributes[blotName.tableCellInner] as TableCellValue;
          const styleObj = cssTextToObject(style || '');
          if (!styleObj.backgroundColor) {
            styleObj.backgroundColor = backgroundColor;
            op.attributes[blotName.tableCellInner] = { ...value, style: objectToCssText(styleObj) };
          }
        }
      }
    }
  }

  getTargetFull() {
    const tableModule = this.quill.getModule(tableUpInternal.moduleName) as TableUp | undefined;
    return !!tableModule?.options.full;
  }

  matchTable(node: Node, delta: TypeDelta) {
    if (delta.ops.length === 0) return delta;

    const ops: Record<string, any>[] = [];
    const cols: Record<string, any>[] = [];
    let bodyStartIndex = -1;
    for (let i = 0; i < delta.ops.length; i++) {
      const { attributes, insert } = delta.ops[i];
      // if attribute doesn't have tableCellInner, treat it as a blank line(emptyRow)
      if (!isObject(insert) && (!attributes || (!attributes[blotName.tableCellInner] && !attributes[blotName.tableCaption]))) {
        delta.ops.splice(i, 1);
        i -= 1;
        continue;
      }
      // remove quill origin table format and tableCell format
      const { table, [blotName.tableCell]: tableCell, ...attrs } = attributes || {};
      const hasCol = isObject(insert) && insert[blotName.tableCol];
      if (hasCol) {
        cols.push({ insert });
      }
      else {
        ops.push({ attributes: attrs, insert });
      }
      // record col insert index
      if (
        !attrs?.[blotName.tableCellInner]
        && !attrs?.[blotName.tableCaption]
        && !hasCol
        && isString(insert)
        && insert.trim().length > 0
      ) {
        bodyStartIndex = i;
      }
    }

    // If pasted HTML already has cols, keep the normalized mode decided in `matchColgroup`.
    // Otherwise fill every missing col with the default width from `tableUp.options.full`.
    const existingCol = cols.find(c => c?.insert?.[blotName.tableCol]);
    const isFull = existingCol
      ? existingCol.insert[blotName.tableCol].full
      : this.getTargetFull();
    const defaultWidth = getDefaultColWidth(this.colIds.length, isFull);
    const newCols = new Array(this.colIds.length).fill(null).reduce((colOps, _, i) => {
      if (!cols[i]) {
        colOps.push({
          insert: {
            [blotName.tableCol]: {
              tableId: this.tableId,
              colId: this.colIds[i],
              width: defaultWidth,
              full: isFull,
            },
          },
        });
      }
      else {
        colOps.push(cols[i]);
      }
      return colOps;
    }, [] as Record<string, any>[]);
    ops.splice(bodyStartIndex + 1, 0, ...newCols);

    const resultDelta = new Delta(ops);
    this.getStyleBackgroundColor(node, resultDelta);
    // reset variable to avoid conflict with other table
    this.tableId = randomId();
    this.colIds = [];
    this.rowspanCount = [];
    this.cellCount = 0;
    this.colCount = 0;
    return resultDelta;
  }

  matchTbody(node: Node, delta: TypeDelta) {
    this.getStyleBackgroundColor(node, delta);
    // add `emptyRow`
    let emptyRows = [];
    for (let i = delta.ops.length - 1; i >= 0; i--) {
      const op = delta.ops[i];
      if (!op.attributes?.[blotName.tableCellInner]) {
        emptyRows = [];
        const lineCount = op.insert
          ? isString(op.insert)
            ? op.insert.split('\n').length - 1
            : 1
          : 0;
        for (let i = 0; i < lineCount; i++) {
          emptyRows.push(randomId());
        }
      }
      else if (op.attributes) {
        const cellValue = op.attributes[blotName.tableCellInner] as TableCellValue;
        if (cellValue.rowspan === 1) {
          emptyRows = [];
        }
        else if (emptyRows.length > 0) {
          if (!cellValue.emptyRow) {
            cellValue.emptyRow = [];
          }
          if (emptyRows.length > cellValue.emptyRow.length) {
            cellValue.emptyRow!.push(...emptyRows.slice(cellValue.emptyRow.length - emptyRows.length));
          }
        }
      }
    }
    // clear rowspan. thead/tbody/tfoot will not share rowspan
    this.rowspanCount = [];
    return delta;
  }

  matchThead(node: Node, delta: TypeDelta) {
    const deltaData = this.matchTbody(node, delta);
    for (const op of deltaData.ops) {
      if (op.attributes?.[blotName.tableCellInner]) {
        const tableCellInner = op.attributes[blotName.tableCellInner] as TableCellValue;
        tableCellInner.wrapTag = 'thead';
      }
    }
    return deltaData;
  }

  matchTfoot(node: Node, delta: TypeDelta) {
    const deltaData = this.matchTbody(node, delta);
    for (const op of deltaData.ops) {
      if (op.attributes?.[blotName.tableCellInner]) {
        const tableCellInner = op.attributes[blotName.tableCellInner] as TableCellValue;
        tableCellInner.wrapTag = 'tfoot';
      }
    }
    return deltaData;
  }

  matchColgroup(node: Node, delta: TypeDelta) {
    const ops: Record<string, any>[] = [];
    for (const op of delta.ops) {
      if (op && isObject(op.insert) && op.insert[blotName.tableCol]) {
        ops.push(op);
      }
    }

    if (ops.length > 0) {
      const colgroup = node as HTMLElement;
      const colWidths = getExpandedColWidthMeta(colgroup);
      const hasPercent = colWidths.some(col => col.unit === 'percent');
      const hasPixel = colWidths.some(col => col.unit === 'pixel');
      const isMixed = hasPercent && hasPixel;
      // Pure percent / pure pixel colgroups keep their source mode.
      // Only mixed units are normalized according to `tableUp.options.full`.
      const isFull = isMixed
        ? this.getTargetFull()
        : hasPercent
          ? true
          : hasPixel
            ? false
            : this.getTargetFull();
      // Prefer the pasted table width as the conversion base. If it is missing,
      // fall back to an inferred width from the mixed col values above.
      const tableWidth = getTableWidth(colgroup.closest('table'), colWidths);

      for (const [index, op] of ops.entries()) {
        const colWidth = colWidths[index];
        op.insert[blotName.tableCol].full = isFull;
        op.insert[blotName.tableCol].width = convertColWidth(
          colWidth?.width ?? null,
          colWidth?.unit ?? 'unknown',
          isFull,
          tableWidth,
          ops.length,
        );
      }
    }

    return new Delta(ops);
  }

  matchCol(node: Node, _delta: TypeDelta) {
    // split col by span
    let span = Number((node as HTMLElement).getAttribute('span') || 1);
    if (Number.isNaN(span)) span = 1;

    const colDelta = new Delta();
    for (let i = 0; i < span; i++) {
      this.colIds[this.colCount] = randomId();
      colDelta.insert({
        [blotName.tableCol]: Object.assign(
          TableColFormat.value(node as HTMLElement),
          {
            tableId: this.tableId,
            colId: this.colIds[this.colCount],
          },
        ),
      });
      this.colCount += 1;
    }
    return colDelta;
  }

  matchTr(node: Node, delta: TypeDelta) {
    this.rowId = randomId();
    this.cellCount = 0;
    // minus rowspan
    for (const [i, span] of this.rowspanCount.entries()) {
      if (span.rowspan > 0) {
        span.rowspan -= 1;
      }
      if (span.rowspan <= 0) {
        this.rowspanCount[i] = { rowspan: 0, colspan: 0 };
      }
    }
    this.getStyleBackgroundColor(node, delta);
    // if delta.ops is empty, return a new line. make sure emptyRow parse correctly in `matchTbody`
    return delta.ops.length === 0 ? new Delta([{ insert: '\n' }]) : delta;
  }

  matchTd(node: Node, delta: TypeDelta) {
    const cell = node as HTMLElement;
    const cellFormat = TableCellFormat.formats(cell);
    if (!this.colIds[this.cellCount] || !this.rowspanCount[this.cellCount]) {
      for (let i = this.cellCount; i >= 0; i--) {
        if (!this.colIds[i]) {
          this.colIds[i] = randomId();
        }
        if (!this.rowspanCount[i]) {
          this.rowspanCount[i] = { rowspan: 0, colspan: 0 };
        }
      }
    }
    // skip the colspan of the cell in the previous row
    for (let i = this.cellCount; i < this.rowspanCount.length; i++) {
      const { rowspan, colspan } = this.rowspanCount[i];
      if (rowspan === 0) break;
      this.cellCount += colspan;
    }
    // add current cell rowspan in `rowspanCount` to calculate next row cell
    if (cellFormat.rowspan > 1) {
      this.rowspanCount[this.cellCount] = { rowspan: cellFormat.rowspan, colspan: cellFormat.colspan };
    }
    const colId = this.colIds[this.cellCount];
    this.cellCount += cellFormat.colspan;

    // add each insert tableCellInner format
    const value = Object.assign(
      cellFormat,
      {
        tableId: this.tableId,
        rowId: this.rowId,
        colId,
      },
    );
    // make sure <!--[if !supportMisalignedColumns]--> display border
    if (cell.style.border === 'none') {
      value.style = value.style.replaceAll(/border-(top|right|bottom|left)-style:none;?/g, '');
    }
    const ops = [];
    for (const op of delta.ops) {
      const { attributes = {}, ...other } = op;
      const { [blotName.tableCell]: tableCell, ...attrs } = attributes;
      ops.push({ ...other, attributes: { ...attrs, [blotName.tableCellInner]: value } });
    }
    if (ops.length <= 0 || !isString(ops[ops.length - 1].insert) || !(ops[ops.length - 1].insert as string).endsWith('\n')) {
      ops.push({ insert: '\n', attributes: { [blotName.tableCellInner]: value } });
    }
    return new Delta(ops);
  }

  matchTdAttributor(node: Node, delta: TypeDelta) {
    const el = node as HTMLElement;
    if (el.tagName.toLocaleLowerCase() === 'td') {
      const ops = [];
      for (const op of delta.ops) {
        const { attributes, ...other } = op;
        const tableCellInner = attributes?.[blotName.tableCellInner] as TableCellValue;
        if (attributes && tableCellInner?.style) {
          const { background, ...attrs } = attributes;

          const bgTemp = document.createElement('div');
          bgTemp.style.background = background as string;
          const cellTemp = document.createElement('div');
          cellTemp.style.cssText = tableCellInner.style;
          if (bgTemp.style.background === cellTemp.style.backgroundColor) {
            ops.push({ ...other, attributes: { ...attrs } });
            continue;
          }
        }

        ops.push(op);
      }
      return new Delta(ops);
    }

    return delta;
  }

  convert(
    { html, text }: { html?: string; text?: string },
    formats: Record<string, unknown> = {},
  ): TypeDelta {
    const delta = super.convert({ html, text }, formats);
    if (formats[blotName.tableCellInner]) {
      for (const op of delta.ops) {
        if (isObject(op.insert) && op.insert[blotName.tableCol]) {
          op.insert = '';
          continue;
        }
        if (!op.attributes) op.attributes = {};
        op.attributes[blotName.tableCellInner] = formats[blotName.tableCellInner];
      }
    }
    return delta;
  }

  matchCaption(node: Node, delta: TypeDelta) {
    for (const op of delta.ops) {
      const { attributes } = op;
      if (attributes?.[blotName.tableCaption]) {
        (attributes[blotName.tableCaption] as TableCaptionValue).tableId = this.tableId;
        op.attributes = attributes;
      }
    }

    return delta;
  }
}

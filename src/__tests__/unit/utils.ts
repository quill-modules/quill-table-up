import type { Op, Delta as TypeDelta, Range as TypeRange } from 'quill';
import type { TableCaptionValue, TableColValue, TableUpOptions } from '../../utils';
import Quill from 'quill';
import { expect, vi } from 'vitest';
import { TableUp } from '../../table-up';

const Delta = Quill.import('delta');

export const normalizeHTML = (html: string | { html: string }) => typeof html === 'object' ? html.html : html.replaceAll(/\n\s*/g, '');
export function normalizeStyle(style: string) {
  if (!style) return '';
  return style
    .split(';')
    .map(style => style.trim())
    .filter(Boolean)
    .map((style) => {
      const [property, value] = style.split(':').map(s => s.trim());
      return property && value ? `${property}:${value}` : '';
    })
    .filter(Boolean)
    .toSorted()
    .join(';');
}

export function sortAttributes(element: HTMLElement) {
  const attributes = Array.from(element.attributes);
  const sortedAttributes = attributes.toSorted((a, b) => a.name.localeCompare(b.name));

  while (element.attributes.length > 0) {
    element.removeAttribute(element.attributes[0].name);
  }

  for (const attr of sortedAttributes) {
    element.setAttribute(attr.name, attr.value);
  }

  // eslint-disable-next-line unicorn/no-array-for-each
  element.childNodes.forEach((child) => {
    if (child instanceof HTMLElement) {
      sortAttributes(child);
    }
  });
}
export function createQuillWithTableModule(html: string, tableOptions: Partial<TableUpOptions> = {}, moduleOptions = {}, quillOptions = {}, register = {}) {
  Quill.register({
    [`modules/${TableUp.moduleName}`]: TableUp,
    ...register,
  }, true);
  const container = document.body.appendChild(document.createElement('div'));
  container.innerHTML = normalizeHTML(html);
  const quill = new Quill(container, {
    theme: 'snow',
    modules: {
      [TableUp.moduleName]: {
        full: true,
        ...tableOptions,
      },
      history: {
        delay: 0,
      },
      ...moduleOptions,
    },
    ...quillOptions,
  });
  return quill;
}
export function replaceAttrEmptyRow(value: string) {
  try {
    const emptyRow = JSON.parse(value);
    return `length:${emptyRow.length}`;
  }
  catch {
    return value;
  }
}

expect.extend({
  toEqualHTML(
    received,
    expected,
    {
      ignoreAttrs = [],
      replaceAttrs = {},
    }: {
      ignoreAttrs?: string[];
      replaceAttrs?: Record<string, (attrValue: string) => string>;
    } = {},
  ) {
    const receivedDOM = document.createElement('div');
    const expectedDOM = document.createElement('div');
    receivedDOM.innerHTML = normalizeHTML(
      typeof received === 'string' ? received : received.innerHTML,
    );
    expectedDOM.innerHTML = normalizeHTML(expected);

    for (const [attr, handler] of Object.entries(replaceAttrs)) {
      for (const node of Array.from(receivedDOM.querySelectorAll(`[${attr}]`))) {
        const attrValue = node.getAttribute(attr);
        if (attrValue) {
          node.setAttribute(attr, handler(attrValue));
        }
      }
    }

    const doms = [receivedDOM, expectedDOM];
    for (const dom of doms) {
      for (const node of Array.from(dom.querySelectorAll('.ql-ui'))) {
        node.remove();
      }

      for (const attr of ignoreAttrs) {
        for (const node of Array.from(dom.querySelectorAll(`[${attr}]`))) {
          node.removeAttribute(attr);
        }
      }

      sortAttributes(dom);

      // normalize style attributes to handle different order
      for (const node of Array.from(dom.querySelectorAll('[style]'))) {
        const styleAttr = node.getAttribute('style');
        if (styleAttr) {
          node.setAttribute('style', normalizeStyle(styleAttr));
        }
      }
    }

    if (this.equals(receivedDOM.innerHTML, expectedDOM.innerHTML)) {
      return { pass: true, message: () => '' };
    }
    return {
      pass: false,
      message: () =>
        `HTMLs don't match.\n${this.utils.diff(
          this.utils.stringify(receivedDOM),
          this.utils.stringify(expectedDOM),
        )}\n`,
    };
  },
});

export function expectDelta(received: TypeDelta, expected: TypeDelta) {
  for (const [i, op] of expected.ops.entries()) {
    expect(op).toMatchObject(received.ops[i]);
  }
}

interface TableColDeltaValue extends Omit<TableColValue, 'width' | 'full'> {
  width: number;
  full?: boolean;
}
interface TableCreatorOptions {
  isEmpty: boolean;
  tableId: string;
  editable: boolean | null;
}
type ColOptions = Omit<TableColValue, 'width' | 'tableId' | 'colId'> & { width?: number };
interface TableCaptionCreatorOptions extends Omit<TableCaptionValue, 'tableId'> {
  text: string;
}
export const datasetWrapTag = (tag: string = 'tbody') => `data-wrap-tag="${tag}"`;
export const datasetTag = (tag: string = 'td') => `data-tag="${tag}"`;
export const datasetTableId = (id: string) => `data-table-id="${id}"`;
export const datasetFull = (full: boolean) => full ? ' data-full="true"' : '';
export const datasetAlign = (align: string) => align === 'left' ? '' : ` data-align="${align}"`;
export const contenteditableString = (value: boolean | null) => value === null ? '' : ` contenteditable="${value}"`;
export function getColWidthStyle(options: Required<Omit<ColOptions, 'align' | 'tableId' | 'width'>> & { width?: number; colNum: number }) {
  const { full, width, colNum } = options;
  let colWidth = `${width}px`;
  if (full) {
    colWidth = `${Math.trunc(1 / colNum * 100 * 10_000) / 10_000}%`;
  }
  return `width="${colWidth}"`;
}
export function createTableDeltaOps(row: number, col: number, colOptions?: ColOptions, captionOptions?: Partial<TableCaptionCreatorOptions>, options: Partial<TableCreatorOptions> = {}) {
  const { isEmpty = false, tableId = '1' } = options;
  const { full = true, width = 100, align = 'left' } = colOptions || {};
  const { text = '', side = 'top' } = captionOptions || {};
  const table: Op[] = [{ insert: '\n' }];
  if (text) {
    table.push(
      { insert: text },
      {
        attributes: { tableCaption: { side, align, tableId } },
        insert: '\n',
      },
    );
  }
  for (const [i, _] of new Array(col).fill(0).entries()) {
    const value: TableColDeltaValue = { tableId, colId: `${i + 1}`, width: Math.trunc(1 / col * 100 * 10_000) / 10_000, full };
    if (!full) {
      value.width = width;
    }
    if (align !== 'left') {
      value.align = align;
    }
    table.push({ insert: { 'table-up-col': value } });
  }
  for (let i = 0; i < row; i++) {
    for (let j = 0; j < col; j++) {
      if (!isEmpty) {
        table.push({ insert: `${i * col + j + 1}` });
      }
      table.push(
        {
          attributes: { 'table-up-cell-inner': { tableId, rowId: `${i + 1}`, colId: `${j + 1}`, rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } },
          insert: '\n',
        },
      );
    }
  }
  table.push({ insert: '\n' });
  return table;
}
export async function createTable(row: number, col: number, colOptions?: ColOptions, captionOptions?: Partial<TableCaptionCreatorOptions>, options?: Partial<TableCreatorOptions>) {
  const quill = createQuillWithTableModule(`<p><br></p>`);
  quill.setContents(createTableDeltaOps(row, col, colOptions, captionOptions, options));
  // set range for undo won't scrollSelectionIntoView
  quill.setSelection({ index: 0, length: 0 });
  await vi.runAllTimersAsync();
  return quill;
}
export function createTableCaptionHTML(captionOptions?: Partial<TableCaptionCreatorOptions>, options?: Partial<TableCreatorOptions>) {
  const { text = '', side = 'top' } = captionOptions || {};
  const { tableId = '1', editable = true } = options || {};
  return `<caption${contenteditableString(editable)} ${datasetTableId(tableId)}${side === 'top' ? '' : ' style="caption-side: bottom;"'}>${text}</caption>`;
}
export function createTaleColHTML(colNum: number, colOptions?: Partial<ColOptions>, options?: Partial<TableCreatorOptions>) {
  const { full = true, width = 100, align = 'left' } = colOptions || {};
  const { tableId = '1' } = options || {};
  const colWidth = getColWidthStyle({ full, width, colNum });
  return `
    <colgroup contenteditable="false" ${datasetTableId(tableId)}${datasetFull(full)}${datasetAlign(align)}>
      ${new Array(colNum).fill(0).map((_, i) => `<col ${colWidth} ${datasetTableId(tableId)} data-col-id="${i + 1}"${datasetFull(full)}${datasetAlign(align)} />`).join('\n')}
    </colgroup>
  `;
}
export function createTableBodyHTML(row: number, col: number, options?: Partial<TableCreatorOptions>) {
  const { isEmpty = false, tableId = '1', editable = true } = options || {};
  return `
    <tbody ${datasetTableId(tableId)}>
      ${
        new Array(row).fill(0).map((_, i) => `
          <tr ${datasetTableId(tableId)} data-row-id="${i + 1}" ${datasetWrapTag('tbody')}>
            ${
              new Array(col).fill(0).map((_, j) => `<td rowspan="1" colspan="1" ${datasetTableId(tableId)} data-row-id="${i + 1}" data-col-id="${j + 1}" ${datasetWrapTag('tbody')}>
                <div ${datasetTag('td')} ${datasetTableId(tableId)} data-rowspan="1" data-colspan="1" data-row-id="${i + 1}" data-col-id="${j + 1}" ${datasetWrapTag('tbody')}${contenteditableString(editable)}>
                  <p>
                    ${isEmpty ? '<br>' : i * row + j + 1}
                  </p>
                </div>
              </td>`).join('\n')
            }
          </tr>
        `).join('\n')
      }
    </tbody>
  `;
}
export function createTableHTML(row: number, col: number, colOptions?: ColOptions, captionOptions?: Partial<TableCaptionCreatorOptions>, options?: Partial<TableCreatorOptions>) {
  const { full = true, width = 100, align = 'left' } = colOptions || {};
  const { tableId = '1' } = options || {};
  let alignStyle = 'margin-right: auto;';
  switch (align) {
    case 'center': {
      alignStyle = 'margin-left: auto; margin-right: auto;';
      break;
    }
    case '':
    case 'left': {
      alignStyle = 'margin-right: auto;';
      break;
    }
    case 'right': {
      alignStyle = 'margin-left: auto;';
      break;
    }
    default: {
      break;
    }
  }

  return `
    <div contenteditable="false" ${datasetTableId(tableId)}>
      <table cellpadding="0" cellspacing="0" ${datasetTableId(tableId)}${datasetFull(full)}${datasetAlign(align)} style="${alignStyle}${full ? '' : ` width: ${width * col}px;`}">
        ${captionOptions ? createTableCaptionHTML(captionOptions, options) : ''}
        ${createTaleColHTML(col, colOptions)}
        ${createTableBodyHTML(row, col, options)}
      </table>
    </div>
  `;
}

export function simulatePasteHTML(quill: Quill, range: TypeRange, html: string) {
  const formats = quill.getFormat(range.index);
  const pastedDelta = quill.clipboard.convert(
    { html },
    formats,
  );
  const delta = new Delta()
    .retain(range.index)
    .delete(range.length)
    .concat(pastedDelta);
  quill.updateContents(delta);
  return vi.runAllTimersAsync();
}

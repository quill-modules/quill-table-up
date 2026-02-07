import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TableCellInnerFormat } from '../../formats';
import { TableUp } from '../../table-up';
import { createQuillWithTableModule, createTable } from './utils';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('remove column from table', () => {
  it('remove column', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    tableModule.insertTable(3, 3);
    await vi.runAllTimersAsync();
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.removeCol([tds[0], tds[1], tds[3], tds[4]]);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" data-full="true">
            <colgroup data-full="true">
              <col width="99.9999%" data-full="true" />
            </colgroup>
            <tbody>
              ${
                new Array(3).fill(0).map(() => `
                  <tr>
                    <td rowspan="1" colspan="1"><div><p><br></p></div></td>
                  </tr>
                `).join('\n')
              }
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });

  it('remove column in not full table', async () => {
    const quill = await createTable(1, 3, { full: false });
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    await vi.runAllTimersAsync();
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.removeCol([tds[0]]);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" style="margin-right: auto; width: 200px;">
            <colgroup>
              <col width="100px" />
              <col width="100px" />
            </colgroup>
            <tbody>
                <tr>
                  <td rowspan="1" colspan="1"><div><p>2</p></div></td>
                  <td rowspan="1" colspan="1"><div><p>3</p></div></td>
                </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });

  it('remove column. remove colspan start cell and rowspan cell', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    tableModule.insertTable(4, 4);
    await vi.runAllTimersAsync();
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[4], tds[5], tds[6], tds[8], tds[9], tds[10]]);
    await vi.runAllTimersAsync();
    tableModule.mergeCells([tds[13], tds[14], tds[15]]);
    await vi.runAllTimersAsync();
    tableModule.removeCol([tds[1], tds[2]]);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" data-full="true">
            <colgroup data-full="true">
              <col width="25%" data-full="true" />
              <col width="75%" data-full="true" />
            </colgroup>
            <tbody>
              <tr>
                <td rowspan="1" colspan="1"><div><p><br></p></div></td>
                <td rowspan="1" colspan="1"><div><p><br></p></div></td>
              </tr>
              <tr>
                <td rowspan="2" colspan="1">
                  <div>
                    <p><br></p>
                  </div>
                </td>
                <td rowspan="1" colspan="1"><div><p><br></p></div></td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1"><div><p><br></p></div></td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1"><div><p><br></p></div></td>
                <td rowspan="1" colspan="1">
                  <div>
                    <p><br></p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });
});

describe('remove row from table', () => {
  it('remove row', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    tableModule.insertTable(3, 3);
    await vi.runAllTimersAsync();
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.removeRow([tds[0], tds[1], tds[2], tds[3], tds[4], tds[5]]);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" data-full="true">
            <colgroup data-full="true">
              ${new Array(3).fill(0).map(() => `<col width="33.3333%" data-full="true" />`).join('\n')}
            </colgroup>
            <tbody>
              <tr>
                ${new Array(3).fill(0).map(() => `<td rowspan="1" colspan="1"><div><p><br></p></div></td>`).join('\n')}
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });

  it('remove row. remove rowspan cell at start index', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    tableModule.insertTable(3, 3);
    await vi.runAllTimersAsync();
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[1], tds[2], tds[4], tds[5]]);
    await vi.runAllTimersAsync();
    tableModule.removeRow([tds[0]]);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" data-full="true">
            <colgroup data-full="true">
              ${new Array(3).fill(0).map(() => `<col width="33.3333%" data-full="true" />`).join('\n')}
            </colgroup>
            <tbody>
              <tr>
                <td rowspan="1" colspan="1"><div><p><br></p></div></td>
                <td rowspan="1" colspan="2"><div><p><br></p></div></td>
              </tr>
              <tr>
                ${new Array(3).fill(0).map(() => `<td rowspan="1" colspan="1"><div><p><br></p></div></td>`).join('\n')}
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });
});

describe('unusual delete', () => {
  it('delete head from outside table to inside', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    tableModule.insertTable(5, 5);
    await vi.runAllTimersAsync();
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[0], tds[1], tds[2], tds[5], tds[6], tds[7], tds[10], tds[11], tds[12]]);
    tableModule.mergeCells([tds[4], tds[9], tds[14], tds[19]]);
    tableModule.mergeCells([tds[17], tds[18], tds[22], tds[23]]);
    await vi.runAllTimersAsync();
    quill.deleteText(0, 16);
    await vi.runAllTimersAsync();
    // After remove all `col`, `fixUnusuaDeletelTable` will remove whole table.
    // The remaining two rows around
    expect(quill.root).toEqualHTML(`<p><br></p><p><br></p>`);
  });

  it('delete tail from inside table to outside', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    tableModule.insertTable(5, 5);
    await vi.runAllTimersAsync();
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[0], tds[1], tds[2], tds[5], tds[6], tds[7], tds[10], tds[11], tds[12]]);
    await vi.runAllTimersAsync();
    tableModule.mergeCells([tds[4], tds[9], tds[14], tds[19]]);
    await vi.runAllTimersAsync();
    tableModule.mergeCells([tds[17], tds[18], tds[22], tds[23]]);
    await vi.runAllTimersAsync();
    quill.deleteText(9, 5);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" data-full="true">
            <colgroup data-full="true">
              <col width="60%" data-full="true" />
              <col width="20%" data-full="true" />
              <col width="20%" data-full="true" />
            </colgroup>
            <tbody>
              <tr>
                <td rowspan="2" colspan="1">
                  <div>
                    <p><br></p>
                  </div>
                </td>
                <td rowspan="1" colspan="1"><div><p><br></p></div></td>
                <td rowspan="2" colspan="1">
                  <div>
                    <p><br></p>
                  </div>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1"><div><p><br></p></div></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });

  it('delete table inside cell', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    tableModule.insertTable(5, 5);
    await vi.runAllTimersAsync();
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[0], tds[1], tds[2], tds[5], tds[6], tds[7], tds[10], tds[11], tds[12]]);
    tableModule.mergeCells([tds[4], tds[9], tds[14], tds[19]]);
    tableModule.mergeCells([tds[17], tds[18], tds[22], tds[23]]);
    await vi.runAllTimersAsync();
    quill.deleteText(10, 3);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" data-full="true">
            <colgroup data-full="true">
              ${new Array(5).fill(`<col width="20%" data-full="true" />`).join('\n')}
            </colgroup>
            <tbody>
              <tr>
               <td rowspan="3" colspan="3">
                  <div>
                    <p><br></p>
                  </div>
                </td>
                <td rowspan="1" colspan="1"><div><p><br></p></div></td>
                <td rowspan="4" colspan="1">
                  <div>
                    <p><br></p>
                  </div>
                </td>
              </tr>
              <tr><td rowspan="1" colspan="1"><div><p><br></p></div></td></tr>
              <tr><td rowspan="1" colspan="1"><div><p><br></p></div></td></tr>
              <tr>
                ${new Array(4).fill(`<td rowspan="1" colspan="1"><div><p><br></p></div></td>`).join('\n')}
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });
});

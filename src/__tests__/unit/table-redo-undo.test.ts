import type { Op, Parchment as TypeParchment } from 'quill';
import type { TableCaptionFormat, TableMainFormat } from '../../formats';
import type { ToolOption } from '../../utils';
import Quill from 'quill';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TableCellInnerFormat } from '../../formats';
import { tableMenuTools, TableSelection } from '../../modules';
import { TableUp } from '../../table-up';
import { createQuillWithTableModule, createTable, createTableBodyHTML, createTableDeltaOps, createTableHTML, createTaleColHTML, datasetAlign, datasetFull, expectDelta } from './utils';

const Delta = Quill.import('delta');

if (!Range.prototype.getBoundingClientRect) {
  Range.prototype.getBoundingClientRect = function () {
    return {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      toJSON: () => {},
    };
  };
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('table undo', () => {
  it('merge all cell undo', async () => {
    const quill = await createTable(3, 3);
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells(tds);
    await vi.runAllTimersAsync();
    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${createTableHTML(3, 3)}
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'contenteditable'] },
    );
  });

  it('merge single column undo', async () => {
    const quill = await createTable(3, 3);
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[0], tds[3], tds[6]]);
    await vi.runAllTimersAsync();
    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${createTableHTML(3, 3)}
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'contenteditable'] },
    );
  });

  it('merge last column undo', async () => {
    const quill = await createTable(3, 3);
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[2], tds[5], tds[8]]);
    await vi.runAllTimersAsync();
    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${createTableHTML(3, 3)}
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'contenteditable'] },
    );
  });

  it('merge middle column undo', async () => {
    const quill = await createTable(4, 4);
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[1], tds[2], tds[5], tds[6], tds[9], tds[10], tds[13], tds[14]]);
    await vi.runAllTimersAsync();
    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${createTableHTML(4, 4)}
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'contenteditable'] },
    );
  });

  it('split column undo', async () => {
    const quill = await createTable(3, 3);
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[2], tds[5], tds[8]]);
    await vi.runAllTimersAsync();
    tableModule.splitCell([tds[2]]);
    await vi.runAllTimersAsync();
    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" data-full="true">
            <colgroup data-full="true">
              ${new Array(3).fill(0).map((_, i) => `<col width="33.3333%" data-col-id="${i + 1}" data-full="true" />`).join('\n')}
            </colgroup>
            <tbody>
              <tr data-row-id="1">
                <td rowspan="1" colspan="1" data-col-id="1" data-row-id="1">
                  <div data-rowspan="1" data-colspan="1" data-row-id="1" data-col-id="1"><p>1</p></div>
                </td>
                <td rowspan="1" colspan="1" data-col-id="2" data-row-id="1">
                  <div data-rowspan="1" data-colspan="1" data-row-id="1" data-col-id="2"><p>2</p></div>
                </td>
                <td rowspan="3" colspan="1" data-col-id="3" data-row-id="1">
                  <div data-rowspan="3" data-colspan="1" data-row-id="1" data-col-id="3">
                    <p>3</p>
                    <p>6</p>
                    <p>9</p>
                  </div>
                </td>
              </tr>
              <tr data-row-id="2">
                <td rowspan="1" colspan="1" data-col-id="1" data-row-id="2">
                  <div data-rowspan="1" data-colspan="1" data-row-id="2" data-col-id="1"><p>4</p></div>
                </td>
                <td rowspan="1" colspan="1" data-col-id="2" data-row-id="2">
                  <div data-rowspan="1" data-colspan="1" data-row-id="2" data-col-id="2"><p>5</p></div>
                </td>
              </tr>
              <tr data-row-id="3">
                <td rowspan="1" colspan="1" data-col-id="1" data-row-id="3">
                  <div data-rowspan="1" data-colspan="1" data-row-id="3" data-col-id="1"><p>7</p></div>
                </td>
                <td rowspan="1" colspan="1" data-col-id="2" data-row-id="3">
                  <div data-rowspan="1" data-colspan="1" data-row-id="3" data-col-id="2"><p>8</p></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'style', 'data-table-id', 'contenteditable'] },
    );
  });

  it('split middle column undo', async () => {
    const quill = await createTable(4, 4);
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[1], tds[2], tds[5], tds[6], tds[9], tds[10], tds[13], tds[14]]);
    await vi.runAllTimersAsync();
    tableModule.splitCell([tds[1]]);
    await vi.runAllTimersAsync();
    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" data-full="true">
            <colgroup data-full="true">
              <col width="25%" data-col-id="1" data-full="true" />
              <col width="50%" data-col-id="2" data-full="true" />
              <col width="25%" data-col-id="4" data-full="true" />
            </colgroup>
            <tbody>
              <tr data-row-id="1">
                <td rowspan="1" colspan="1" data-col-id="1" data-row-id="1">
                  <div data-rowspan="1" data-colspan="1" data-row-id="1" data-col-id="1"><p>1</p></div>
                </td>
                <td rowspan="4" colspan="1" data-col-id="2" data-row-id="1">
                  <div data-rowspan="4" data-colspan="1" data-row-id="1" data-col-id="2">
                    <p>2</p>
                    <p>3</p>
                    <p>6</p>
                    <p>7</p>
                    <p>10</p>
                    <p>11</p>
                    <p>14</p>
                    <p>15</p>
                  </div>
                </td>
                <td rowspan="1" colspan="1" data-col-id="4" data-row-id="1">
                  <div data-rowspan="1" data-colspan="1" data-row-id="1" data-col-id="4"><p>4</p></div>
                </td>
              </tr>
              <tr data-row-id="2">
                <td rowspan="1" colspan="1" data-col-id="1" data-row-id="2">
                  <div data-rowspan="1" data-colspan="1" data-row-id="2" data-col-id="1"><p>5</p></div>
                </td>
                <td rowspan="1" colspan="1" data-col-id="4" data-row-id="2">
                  <div data-rowspan="1" data-colspan="1" data-row-id="2" data-col-id="4"><p>8</p></div>
                </td>
              </tr>
              <tr data-row-id="3">
                <td rowspan="1" colspan="1" data-col-id="1" data-row-id="3">
                  <div data-rowspan="1" data-colspan="1" data-row-id="3" data-col-id="1"><p>9</p></div>
                </td>
                <td rowspan="1" colspan="1" data-col-id="4" data-row-id="3">
                  <div data-rowspan="1" data-colspan="1" data-row-id="3" data-col-id="4"><p>12</p></div>
                </td>
              </tr>
              <tr data-row-id="4">
                <td rowspan="1" colspan="1" data-col-id="1" data-row-id="4">
                  <div data-rowspan="1" data-colspan="1" data-row-id="4" data-col-id="1"><p>13</p></div>
                </td>
                <td rowspan="1" colspan="1" data-col-id="4" data-row-id="4">
                  <div data-rowspan="1" data-colspan="1" data-row-id="4" data-col-id="4"><p>16</p></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'style', 'data-table-id', 'contenteditable'] },
    );
  });

  it('merge single row undo', async () => {
    const quill = await createTable(3, 3);
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[0], tds[1], tds[2]]);
    await vi.runAllTimersAsync();
    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${createTableHTML(3, 3)}
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'contenteditable'] },
    );
  });

  it('merge multiple row undo', async () => {
    const quill = await createTable(4, 4);
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[0], tds[1], tds[2], tds[3], tds[4], tds[5], tds[6], tds[7], tds[8], tds[9], tds[10], tds[11]]);
    await vi.runAllTimersAsync();
    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${createTableHTML(4, 4)}
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'contenteditable'] },
    );
  });

  it('merge middle row undo', async () => {
    const quill = await createTable(4, 4);
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[4], tds[5], tds[6], tds[7], tds[8], tds[9], tds[10], tds[11]]);
    await vi.runAllTimersAsync();
    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${createTableHTML(4, 4)}
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'contenteditable'] },
    );
  });

  it('5x5 merge center 3x3 cells undo', async () => {
    const quill = await createTable(5, 5);
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[6], tds[7], tds[8], tds[11], tds[12], tds[13], tds[16], tds[17], tds[18]]);
    await vi.runAllTimersAsync();
    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${createTableHTML(5, 5)}
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'contenteditable'] },
    );
  });

  it('4x4 undo split 3x3 at start 1', async () => {
    const quill = await createTable(4, 4);
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[0], tds[1], tds[2], tds[4], tds[5], tds[6], tds[8], tds[9], tds[10]]);
    await vi.runAllTimersAsync();
    tableModule.splitCell([tds[0]]);
    await vi.runAllTimersAsync();
    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" data-full="true">
            <colgroup data-full="true">
              <col width="25%" data-col-id="1" data-full="true" />
              <col width="25%" data-col-id="2" data-full="true" />
              <col width="25%" data-col-id="3" data-full="true" />
              <col width="25%" data-col-id="4" data-full="true" />
            </colgroup>
            <tbody>
              <tr data-row-id="1">
                <td rowspan="3" colspan="3" data-col-id="1" data-row-id="1">
                  <div data-rowspan="3" data-colspan="3" data-row-id="1" data-col-id="1">
                    <p>1</p>
                    <p>2</p>
                    <p>3</p>
                    <p>5</p>
                    <p>6</p>
                    <p>7</p>
                    <p>9</p>
                    <p>10</p>
                    <p>11</p>
                  </div>
                </td>
                <td rowspan="1" colspan="1" data-col-id="4" data-row-id="1">
                  <div data-rowspan="1" data-colspan="1" data-row-id="1" data-col-id="4"><p>4</p></div>
                </td>
              </tr>
              <tr data-row-id="2">
                <td rowspan="1" colspan="1" data-col-id="4" data-row-id="2">
                  <div data-rowspan="1" data-colspan="1" data-row-id="2" data-col-id="4"><p>8</p></div>
                </td>
              </tr>
              <tr data-row-id="3">
                <td rowspan="1" colspan="1" data-col-id="4" data-row-id="3">
                  <div data-rowspan="1" data-colspan="1" data-row-id="3" data-col-id="4"><p>12</p></div>
                </td>
              </tr>
              <tr data-row-id="4">
                ${
                  [13, 14, 15, 16].map((num, i) => `
                    <td rowspan="1" colspan="1" data-col-id="${i + 1}" data-row-id="4">
                      <div data-rowspan="1" data-colspan="1" data-row-id="4" data-col-id="${i + 1}"><p>${num}</p></div>
                    </td>
                  `).join('\n')
                }
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'style', 'data-table-id', 'contenteditable'] },
    );
    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${createTableHTML(4, 4)}
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'contenteditable'] },
    );
  });

  it('5x5 undo split 3x3 at end 25 and undo merge 3x3 at end 25', async () => {
    const quill = await createTable(5, 5);
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[12], tds[13], tds[14], tds[17], tds[18], tds[19], tds[22], tds[23], tds[24]]);
    await vi.runAllTimersAsync();
    tableModule.splitCell([tds[12]]);
    await vi.runAllTimersAsync();
    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" data-full="true">
            ${createTaleColHTML(5)}
            <tbody>
              <tr data-row-id="1">
                ${
                  [1, 2, 3, 4, 5].map((n, i) => `
                    <td rowspan="1" colspan="1" data-col-id="${i + 1}" data-row-id="1">
                      <div data-rowspan="1" data-colspan="1" data-row-id="1" data-col-id="${i + 1}"><p>${n}</p></div>
                    </td>
                  `).join('\n')
                }
              </tr>
              <tr data-row-id="2">
                ${
                  [6, 7, 8, 9, 10].map((n, i) => `
                    <td rowspan="1" colspan="1" data-col-id="${i + 1}" data-row-id="2">
                      <div data-rowspan="1" data-colspan="1" data-row-id="2" data-col-id="${i + 1}"><p>${n}</p></div>
                    </td>
                  `).join('\n')
                }
              </tr>
              <tr data-row-id="3">
                <td rowspan="1" colspan="1" data-col-id="1" data-row-id="3">
                  <div data-rowspan="1" data-colspan="1" data-row-id="3" data-col-id="1"><p>11</p></div>
                </td>
                <td rowspan="1" colspan="1" data-col-id="2" data-row-id="3">
                  <div data-rowspan="1" data-colspan="1" data-row-id="3" data-col-id="2"><p>12</p></div>
                </td>
                <td rowspan="3" colspan="3" data-col-id="3" data-row-id="3">
                  <div data-rowspan="3" data-colspan="3" data-row-id="3" data-col-id="3">
                    <p>13</p>
                    <p>14</p>
                    <p>15</p>
                    <p>18</p>
                    <p>19</p>
                    <p>20</p>
                    <p>23</p>
                    <p>24</p>
                    <p>25</p>
                  </div>
                </td>
              </tr>
              <tr data-row-id="4">
                ${
                  [16, 17].map((n, i) => `
                    <td rowspan="1" colspan="1" data-col-id="${i + 1}" data-row-id="4">
                      <div data-rowspan="1" data-colspan="1" data-row-id="4" data-col-id="${i + 1}"><p>${n}</p></div>
                    </td>
                  `).join('\n')
                }
              </tr>
              <tr data-row-id="5">
                ${
                  [21, 22].map((n, i) => `
                    <td rowspan="1" colspan="1" data-col-id="${i + 1}" data-row-id="5">
                      <div data-rowspan="1" data-colspan="1" data-row-id="5" data-col-id="${i + 1}"><p>${n}</p></div>
                    </td>
                  `).join('\n')
                }
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'style', 'data-table-id', 'contenteditable'] },
    );
    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${createTableHTML(5, 5)}
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'contenteditable'] },
    );
  });

  it('5x5 undo split 4x4 at start 1', async () => {
    const quill = await createTable(5, 5);
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[0], tds[1], tds[2], tds[3], tds[5], tds[6], tds[7], tds[8], tds[10], tds[11], tds[12], tds[13], tds[15], tds[16], tds[17], tds[18]]);
    await vi.runAllTimersAsync();
    tableModule.splitCell([tds[0]]);
    await vi.runAllTimersAsync();
    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" data-full="true">
            ${createTaleColHTML(5)}
            <tbody>
              <tr data-row-id="1">
                <td rowspan="4" colspan="4" data-col-id="1" data-row-id="1">
                  <div data-rowspan="4" data-colspan="4" data-row-id="1" data-col-id="1">
                    <p>1</p>
                    <p>2</p>
                    <p>3</p>
                    <p>4</p>
                    <p>6</p>
                    <p>7</p>
                    <p>8</p>
                    <p>9</p>
                    <p>11</p>
                    <p>12</p>
                    <p>13</p>
                    <p>14</p>
                    <p>16</p>
                    <p>17</p>
                    <p>18</p>
                    <p>19</p>
                  </div>
                </td>
                <td rowspan="1" colspan="1" data-col-id="5" data-row-id="1">
                  <div data-rowspan="1" data-colspan="1" data-row-id="1" data-col-id="5"><p>5</p></div>
                </td>
              </tr>
              <tr data-row-id="2">
                ${
                  [10].map(n => `
                    <td rowspan="1" colspan="1" data-col-id="5" data-row-id="2">
                      <div data-rowspan="1" data-colspan="1" data-row-id="2" data-col-id="5"><p>${n}</p></div>
                    </td>
                  `).join('\n')
                }
              </tr>
              <tr data-row-id="3">
                ${
                  [15].map(n => `
                    <td rowspan="1" colspan="1" data-col-id="5" data-row-id="3">
                      <div data-rowspan="1" data-colspan="1" data-row-id="3" data-col-id="5"><p>${n}</p></div>
                    </td>
                  `).join('\n')
                }
              </tr>
              <tr data-row-id="4">
                ${
                  [20].map(n => `
                    <td rowspan="1" colspan="1" data-col-id="5" data-row-id="4">
                      <div data-rowspan="1" data-colspan="1" data-row-id="4" data-col-id="5"><p>${n}</p></div>
                    </td>
                  `).join('\n')
                }
              </tr>
              <tr data-row-id="5">
                ${
                  [21, 22, 23, 24, 25].map((n, i) => `
                    <td rowspan="1" colspan="1" data-col-id="${i + 1}" data-row-id="5">
                      <div data-rowspan="1" data-colspan="1" data-row-id="5" data-col-id="${i + 1}"><p>${n}</p></div>
                    </td>
                  `).join('\n')
                }
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'style', 'data-table-id', 'contenteditable'] },
    );
    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${createTableHTML(5, 5)}
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'contenteditable'] },
    );
  });

  it('5x5 undo insert column right with before empty row at start 1', async () => {
    const quill = await createTable(5, 5);
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.appendRow([tds[5]], false);
    await vi.runAllTimersAsync();
    tableModule.appendCol([tds[3]], true);
    await vi.runAllTimersAsync();
    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" data-full="true">
            ${createTaleColHTML(5)}
            <tbody>
              <tr>
                ${
                  [1, 2, 3, 4, 5].map(n => `
                    <td rowspan="1" colspan="1">
                      <div data-rowspan="1" data-colspan="1"><p>${n}</p></div>
                    </td>
                  `).join('\n')
                }
              </tr>
              <tr>
                ${
                  new Array(5).fill(0).map(() => `
                    <td rowspan="1" colspan="1">
                      <div data-rowspan="1" data-colspan="1"><p><br /></p></div>
                    </td>
                  `).join('\n')
                }
              </tr>
              <tr>
                ${
                  [6, 7, 8, 9, 10].map(n => `
                    <td rowspan="1" colspan="1">
                      <div data-rowspan="1" data-colspan="1"><p>${n}</p></div>
                    </td>
                  `).join('\n')
                }
              </tr>
              <tr>
                ${
                  [11, 12, 13, 14, 15].map(n => `
                    <td rowspan="1" colspan="1">
                      <div data-rowspan="1" data-colspan="1"><p>${n}</p></div>
                    </td>
                  `).join('\n')
                }
              </tr>
              <tr>
                ${
                  [16, 17, 18, 19, 20].map(n => `
                    <td rowspan="1" colspan="1">
                      <div data-rowspan="1" data-colspan="1"><p>${n}</p></div>
                    </td>
                  `).join('\n')
                }
              </tr>
              <tr>
                ${
                  [21, 22, 23, 24, 25].map(n => `
                    <td rowspan="1" colspan="1">
                      <div data-rowspan="1" data-colspan="1"><p>${n}</p></div>
                    </td>
                  `).join('\n')
                }
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'contenteditable'] },
    );
    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${createTableHTML(5, 5)}
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'contenteditable'] },
    );
  });

  it('3x3 undo insert column right at start 1. updateContents insert text between col', async () => {
    const quill = await createTable(3, 3);
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.appendCol([tds[0]], true);
    await vi.runAllTimersAsync();
    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${createTableHTML(3, 3)}
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'contenteditable'] },
    );
  });

  it('undo and redo remove last column', async () => {
    const quill = await createTable(2, 2, { full: false });
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.removeCol([tds[1]]);
    await vi.runAllTimersAsync();
    const afterColHtml = `
      <p><br></p>
      <div contenteditable="false">
        <table cellpadding="0" cellspacing="0" style="margin-right: auto; width: 200px;">
          <colgroup contenteditable="false">
            <col width="100px" data-col-id="1">
          </colgroup>
          <tbody>
            <tr>
              <td rowspan="1" colspan="1" data-col-id="1">
                <div data-col-id="1"><p>1</p></div>
              </td>
            </tr>
            <tr>
              <td rowspan="1" colspan="1" data-col-id="1">
                <div data-col-id="1"><p>3</p></div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p><br></p>
    `;
    expect(quill.root).toEqualHTML(
      afterColHtml,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'style', 'data-full', 'data-table-id', 'data-row-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${createTableHTML(2, 2, { full: false })}
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'contenteditable'] },
    );
    quill.history.redo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      afterColHtml,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'style', 'data-full', 'data-table-id', 'data-row-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });

  it('undo and redo cell convert', async () => {
    const quill = await createTable(3, 3, { full: false }, {}, { isEmpty: false });
    const originDelta = [
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 100 } } },
      { insert: '1' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '2' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '3' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '4' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '5' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '6' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '7' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '8' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '9' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '\n' },
    ];
    const thDelta = [
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 100 } } },
      { insert: '1' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'th', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '2' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1, tag: 'th', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '3' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1, tag: 'th', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '4' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1, tag: 'th', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '5' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1, tag: 'th', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '6' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1, tag: 'th', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '7' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 1, colspan: 1, tag: 'th', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '8' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '2', rowspan: 1, colspan: 1, tag: 'th', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '9' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '3', rowspan: 1, colspan: 1, tag: 'th', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '\n' },
    ];
    quill.setContents(originDelta);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    for (const td of tds) {
      td.convertTableCell();
    }
    await vi.runAllTimersAsync();
    expectDelta(
      quill.getContents(),
      new Delta(thDelta),
    );

    quill.history.undo();
    await vi.runAllTimersAsync();
    expectDelta(
      quill.getContents(),
      new Delta(originDelta),
    );

    quill.history.redo();
    await vi.runAllTimersAsync();
    expectDelta(
      quill.getContents(),
      new Delta(thDelta),
    );
  });

  it('undo and redo merge cell span 2 bodys', async () => {
    const quill = createQuillWithTableModule('<p><br></p>');
    const tableModule = quill.getModule('table-up') as TableUp;
    const ops = [
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 100 } } },
      { insert: '1' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '2' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '3' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '4' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '5' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '6' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '\n' },
    ];
    quill.setContents(ops);

    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[0], tds[1], tds[3], tds[4]]);
    await vi.runAllTimersAsync();
    const mergedOps = [
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 200 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 100 } } },
      { insert: '1' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 2, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '2' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 2, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '4' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 2, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '5' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 2, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '3' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '6' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '\n' },
    ];
    expectDelta(
      quill.getContents(),
      new Delta(mergedOps),
    );

    quill.history.undo();
    await vi.runAllTimersAsync();
    expectDelta(
      quill.getContents(),
      new Delta(ops),
    );

    quill.history.redo();
    await vi.runAllTimersAsync();
    expectDelta(
      quill.getContents(),
      new Delta(mergedOps),
    );
  });

  it('undo and redo merge cell span 3 bodys', async () => {
    const quill = createQuillWithTableModule('<p><br></p>');
    const tableModule = quill.getModule('table-up') as TableUp;
    const ops = [
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 100 } } },
      { insert: '1' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '2' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '3' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '4' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '5' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '6' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '7' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tfoot' } }, insert: '\n' },
      { insert: '8' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tfoot' } }, insert: '\n' },
      { insert: '9' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tfoot' } }, insert: '\n' },
      { insert: '\n' },
    ];
    quill.setContents(ops);

    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[0], tds[3], tds[6]]);
    await vi.runAllTimersAsync();
    const mergedOps = [
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 100 } } },
      { insert: '1' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 3, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '4' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 3, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '7' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 3, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '2' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '3' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '5' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '6' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '8' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '9' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '\n' },
    ];
    expectDelta(
      quill.getContents(),
      new Delta(mergedOps),
    );

    quill.history.undo();
    await vi.runAllTimersAsync();
    expectDelta(
      quill.getContents(),
      new Delta(ops),
    );

    quill.history.redo();
    await vi.runAllTimersAsync();
    expectDelta(
      quill.getContents(),
      new Delta(mergedOps),
    );
  });

  it('undo and redo split cell span 2 bodys', async () => {
    const quill = createQuillWithTableModule('<p><br></p>');
    const tableModule = quill.getModule('table-up') as TableUp;
    const ops = [
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 100 } } },
      { insert: '1' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 2, colspan: 2, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '2' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 2, colspan: 2, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '4' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 2, colspan: 2, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '5' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 2, colspan: 2, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '3' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '6' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '7' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tfoot' } }, insert: '\n' },
      { insert: '8' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tfoot' } }, insert: '\n' },
      { insert: '9' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tfoot' } }, insert: '\n' },
      { insert: '\n' },
    ];
    quill.setContents(ops);

    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.splitCell([tds[0]]);
    await vi.runAllTimersAsync();
    const splitOps = [
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 100 } } },
      { insert: '1' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '2' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '4' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '5' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '3' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '6' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '7' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tfoot' } }, insert: '\n' },
      { insert: '8' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tfoot' } }, insert: '\n' },
      { insert: '9' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tfoot' } }, insert: '\n' },
      { insert: '\n' },
    ];
    expectDelta(
      quill.getContents(),
      new Delta(splitOps),
    );

    quill.history.undo();
    await vi.runAllTimersAsync();
    expectDelta(
      quill.getContents(),
      new Delta(ops),
    );

    quill.history.redo();
    await vi.runAllTimersAsync();
    expectDelta(
      quill.getContents(),
      new Delta(splitOps),
    );
  });

  it('undo and redo split cell span 3 bodys', async () => {
    const quill = createQuillWithTableModule('<p><br></p>');
    const tableModule = quill.getModule('table-up') as TableUp;
    const ops = [
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 100 } } },
      { insert: '1' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 3, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '4' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 3, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '7' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 3, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '2' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '3' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '5' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '6' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '8' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '9' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '\n' },
    ];
    quill.setContents(ops);

    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.splitCell([tds[0]]);
    await vi.runAllTimersAsync();
    const splitOps = [
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 100 } } },
      { insert: '1' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '4' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '7' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '2' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '3' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '5' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '6' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '8' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '9' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'thead' } }, insert: '\n' },
      { insert: '\n' },
    ];
    expectDelta(
      quill.getContents(),
      new Delta(splitOps),
    );

    quill.history.undo();
    await vi.runAllTimersAsync();
    expectDelta(
      quill.getContents(),
      new Delta(ops),
    );

    quill.history.redo();
    await vi.runAllTimersAsync();
    expectDelta(
      quill.getContents(),
      new Delta(splitOps),
    );
  });

  it('undo merge cell with Container', async () => {
    const quill = createQuillWithTableModule('<p><br></p>');
    const tableModule = quill.getModule('table-up') as TableUp;
    quill.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 100 } } },
      { insert: '1' },
      { attributes: { 'list': 'ordered', 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '2' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '3' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '4' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '5' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '6' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '7' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '8' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '9' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '\n' },
    ]);

    const mergedOps = [
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 100 } } },
      { insert: '1' },
      { attributes: { 'list': 'ordered', 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 2, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '2' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 2, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '3' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '4' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '5' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '6' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '7' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '8' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '9' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '\n' },
    ];
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[0], tds[1]]);
    await vi.runAllTimersAsync();
    expectDelta(
      quill.getContents(),
      new Delta(mergedOps),
    );

    quill.history.undo();
    await vi.runAllTimersAsync();
    expectDelta(
      quill.getContents(),
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 100 } } },
        { insert: '1' },
        { attributes: { 'list': 'ordered', 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { insert: '2' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { insert: '3' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { insert: '4' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { insert: '5' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { insert: '6' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { insert: '7' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { insert: '8' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { insert: '9' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { insert: '\n' },
      ]),
    );

    quill.history.redo();
    await vi.runAllTimersAsync();
    expectDelta(
      quill.getContents(),
      new Delta(mergedOps),
    );
  });

  it('undo merge cell with BlockEmbed', async () => {
    const quill = createQuillWithTableModule('<p><br></p>');
    const tableModule = quill.getModule('table-up') as TableUp;
    const originDelta = [
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 100 } } },
      { insert: '1' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: { video: 'some.com' } },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n\n' },
      { insert: '3' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '4' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '5' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '6' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '7' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '8' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '9' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '\n' },
    ];
    quill.setContents(originDelta);
    const mergedDelta = [
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 100 } } },
      { insert: '1' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 2, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: { video: 'some.com' } },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 2, tag: 'td', wrapTag: 'tbody' } }, insert: '\n\n' },
      { insert: '3' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '4' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '5' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '6' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '7' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '8' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '9' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '\n' },
    ];

    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[0], tds[1]]);
    await vi.runAllTimersAsync();
    expectDelta(
      quill.getContents(),
      new Delta(mergedDelta),
    );

    quill.history.undo();
    await vi.runAllTimersAsync();
    expectDelta(
      quill.getContents(),
      new Delta(originDelta),
    );

    quill.history.redo();
    await vi.runAllTimersAsync();
    expectDelta(
      quill.getContents(),
      new Delta(mergedDelta),
    );
  });

  it('undo remove cell with BlockEmbed', async () => {
    const quill = createQuillWithTableModule('<p><br></p>');
    const originDelta = [
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 100 } } },
      { insert: '1' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: { video: 'some.com' } },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '123' },
      { attributes: { 'code-block': 'plain', 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '3' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '4' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '5' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '6' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '7' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '8' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '9' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '\n' },
    ];
    const removedDelta = [
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 100 } } },
      { insert: '1' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '3' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '4' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '6' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '7' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '9' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
      { insert: '\n' },
    ];
    quill.setContents(originDelta);

    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    for (const td of [tds[1], tds[4], tds[7]]) {
      const clearTd = td.clone() as TypeParchment.Parent;
      clearTd.appendChild(td.scroll.create('block'));
      td.parent.insertBefore(clearTd, td);
      td.remove();
    }
    await vi.runAllTimersAsync();
    expectDelta(
      quill.getContents(),
      new Delta(removedDelta),
    );

    quill.history.undo();
    await vi.runAllTimersAsync();
    expectDelta(
      quill.getContents(),
      new Delta(originDelta),
    );

    quill.history.redo();
    await vi.runAllTimersAsync();
    expectDelta(
      quill.getContents(),
      new Delta(removedDelta),
    );
  });

  it('undo paste table', async () => {
    const quill = createQuillWithTableModule('<p><br></p>');
    quill.setContents(
      quill.clipboard.convert({ html: '<div class="ql-table-wrapper" data-table-id="1" contenteditable="false"><table class="ql-table" data-table-id="1" cellpadding="0" cellspacing="0" style="margin-right: auto; width: 363px;"><colgroup data-table-id="1" contenteditable="false"><col width="121px" data-table-id="1" data-col-id="1"><col width="121px" data-table-id="1" data-col-id="2"><col width="121px" data-table-id="1" data-col-id="3"></colgroup><tbody data-table-id="1"><tr class="ql-table-row" data-table-id="1" data-row-id="1" data-wrap-tag="tbody"><td class="ql-table-cell" data-table-id="1" data-row-id="1" data-col-id="1" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="1" data-col-id="1" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody" contenteditable="true"><p>1</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="1" data-col-id="2" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="1" data-col-id="2" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody" contenteditable="true"><h1>2</h1></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="1" data-col-id="3" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="1" data-col-id="3" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody" contenteditable="true"><iframe class="ql-video" frameborder="0" allowfullscreen="true" src="some.com"></iframe></div></td></tr><tr class="ql-table-row" data-table-id="1" data-row-id="2" data-wrap-tag="tbody"><td class="ql-table-cell" data-table-id="1" data-row-id="2" data-col-id="1" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="2" data-col-id="1" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody" contenteditable="true"><p>4</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="2" data-col-id="2" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="2" data-col-id="2" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody" contenteditable="true"><p>5</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="2" data-col-id="3" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="2" data-col-id="3" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody" contenteditable="true"><p>6</p></div></td></tr><tr class="ql-table-row" data-table-id="1" data-row-id="3" data-wrap-tag="tbody"><td class="ql-table-cell" data-table-id="1" data-row-id="3" data-col-id="1" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="3" data-col-id="1" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody" contenteditable="true"><p>7</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="3" data-col-id="2" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="3" data-col-id="2" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody" contenteditable="true"><p>8</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="3" data-col-id="3" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="3" data-col-id="3" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody" contenteditable="true"><ol><li data-list="ordered"><span class="ql-ui" contenteditable="false"></span>9</li><li data-list="ordered"><span class="ql-ui" contenteditable="false"></span>end</li></ol></div></td></tr></tbody></table></div>' }),
    );
    await vi.runAllTimersAsync();
    quill.setContents(
      quill.getContents().insert('\n').concat(
        quill.clipboard.convert({ html: '<div class="ql-table-wrapper" data-table-id="1" contenteditable="false"><table class="ql-table" data-table-id="1" cellpadding="0" cellspacing="0" style="margin-right: auto; width: 363px;"><colgroup data-table-id="1" contenteditable="false"><col width="121px" data-table-id="1" data-col-id="1"><col width="121px" data-table-id="1" data-col-id="2"><col width="121px" data-table-id="1" data-col-id="3"></colgroup><tbody data-table-id="1"><tr class="ql-table-row" data-table-id="1" data-row-id="1" data-wrap-tag="tbody"><td class="ql-table-cell" data-table-id="1" data-row-id="1" data-col-id="1" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="1" data-col-id="1" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody" contenteditable="true"><p>1</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="1" data-col-id="2" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="1" data-col-id="2" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody" contenteditable="true"><h1>2</h1></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="1" data-col-id="3" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="1" data-col-id="3" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody" contenteditable="true"><iframe class="ql-video" frameborder="0" allowfullscreen="true" src="some.com"></iframe></div></td></tr><tr class="ql-table-row" data-table-id="1" data-row-id="2" data-wrap-tag="tbody"><td class="ql-table-cell" data-table-id="1" data-row-id="2" data-col-id="1" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="2" data-col-id="1" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody" contenteditable="true"><p>4</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="2" data-col-id="2" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="2" data-col-id="2" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody" contenteditable="true"><p>5</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="2" data-col-id="3" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="2" data-col-id="3" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody" contenteditable="true"><p>6</p></div></td></tr><tr class="ql-table-row" data-table-id="1" data-row-id="3" data-wrap-tag="tbody"><td class="ql-table-cell" data-table-id="1" data-row-id="3" data-col-id="1" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="3" data-col-id="1" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody" contenteditable="true"><p>7</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="3" data-col-id="2" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="3" data-col-id="2" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody" contenteditable="true"><p>8</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="3" data-col-id="3" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="3" data-col-id="3" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody" contenteditable="true"><ol><li data-list="ordered"><span class="ql-ui" contenteditable="false"></span>9</li><li data-list="ordered"><span class="ql-ui" contenteditable="false"></span>end</li></ol></div></td></tr></tbody></table></div>' }),
      ),
    );
    await vi.runAllTimersAsync();
    const pasteTableHTML = `
      <div>
        <table cellpadding="0" cellspacing="0" style="margin-right: auto; width: 363px;">
          ${createTaleColHTML(3, { full: false, width: 121 })}
          <tbody>
            <tr>
              <td>
                <div><p>1</p></div>
              </td>
              <td>
                <div><h1>2</h1></div>
              </td>
              <td>
                <div>
                  <iframe src="some.com" frameborder="0" allowfullscreen="true"></iframe>
                </div>
              </td>
            </tr>
            <tr>
              <td>
                <div><p>4</p></div>
              </td>
              <td>
                <div><p>5</p></div>
              </td>
              <td>
                <div><p>6</p></div>
              </td>
            </tr>
            <tr>
              <td>
                <div><p>7</p></div>
              </td>
              <td>
                <div><p>8</p></div>
              </td>
              <td>
                <div>
                  <ol>
                    <li data-list="ordered">9</li>
                    <li data-list="ordered">end</li>
                  </ol>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${pasteTableHTML}
        <p><br></p>
        <p><br></p>
        ${pasteTableHTML}
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'rowspan', 'data-colspan', 'colspan', 'contenteditable'] },
    );

    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${pasteTableHTML}
        <p><br></p>
        <p><br></p>
        ${pasteTableHTML}
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'rowspan', 'data-colspan', 'colspan', 'contenteditable'] },
    );

    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${pasteTableHTML}
        <p><br></p>
        <p><br></p>
        ${pasteTableHTML}
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'rowspan', 'data-colspan', 'colspan', 'contenteditable'] },
    );
  });

  it('table convert body undo and redo', async () => {
    function resetWrapTag(skip: number, count: number, ops: Op[], wrapTag: string) {
      return [...ops].map((op) => {
        if (op.attributes?.['table-up-cell-inner']) {
          if (skip > 0) {
            skip -= 1;
          }
          else if (count > 0) {
            count -= 1;
            return { ...op, attributes: { ...op.attributes, 'table-up-cell-inner': { ...op.attributes['table-up-cell-inner'], wrapTag } } };
          }
        }
        return op;
      });
    }

    const quill = createQuillWithTableModule('<p><br></p>');
    const originDelta = createTableDeltaOps(5, 5, { full: false }, {}, { isEmpty: false });
    quill.setContents(originDelta);
    await vi.runAllTimersAsync();
    const table = quill.root.querySelector('table')!;
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);

    (tableMenuTools.ConvertTothead as ToolOption).handle.call({ quill, table } as any, tableModule, tds.slice(0, 10), null);
    await vi.runAllTimersAsync();
    const headDelta = new Delta(resetWrapTag(0, 10, originDelta, 'thead'));
    expectDelta(quill.getContents(), headDelta);

    (tableMenuTools.ConvertTotfoot as ToolOption).handle.call({ quill, table } as any, tableModule, tds.slice(15, 25), null);
    await vi.runAllTimersAsync();
    const footDelta = new Delta(resetWrapTag(15, 10, headDelta.ops, 'tfoot'));
    expectDelta(quill.getContents(), footDelta);

    const mergedTds = quill.scroll.descendants(TableCellInnerFormat, 0);
    (tableMenuTools.ConvertTothead as ToolOption).handle.call({ quill, table } as any, tableModule, mergedTds.slice(0, 20), null);
    await vi.runAllTimersAsync();
    expectDelta(
      quill.getContents(),
      new Delta(resetWrapTag(0, 20, footDelta.ops, 'thead')),
    );

    quill.history.undo();
    expectDelta(quill.getContents(), footDelta);

    quill.history.undo();
    expectDelta(quill.getContents(), headDelta);

    quill.history.redo();
    expectDelta(quill.getContents(), footDelta);
  });
});

describe('undo cell attribute', () => {
  it('undo set bg color', async () => {
    const quill = await createTable(3, 3);
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.setCellAttrs([tds[0], tds[1], tds[2]], 'background-color', 'rgb(253, 235, 255)', true);
    await vi.runAllTimersAsync();
    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${createTableHTML(3, 3)}
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'data-table-id', 'contenteditable'] },
    );
  });

  it('undo set border color', async () => {
    const quill = await createTable(2, 2);
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.setCellAttrs([tds[0], tds[1]], 'border-color', 'red', true);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0"${datasetFull(true)} style="margin-right: auto;">
            ${createTaleColHTML(2)}
            <tbody>
              <tr data-row-id="1">
                <td colspan="1" data-col-id="1" data-row-id="1" rowspan="1" style="border-color: red;">
                  <div data-col-id="1" data-colspan="1" data-row-id="1" data-rowspan="1" data-style="border-color: red;">
                    <p>1</p>
                  </div>
                </td>
                <td colspan="1" data-col-id="2" data-row-id="1" rowspan="1" style="border-color: red;">
                  <div data-col-id="2" data-colspan="1" data-row-id="1" data-rowspan="1" data-style="border-color: red;">
                    <p>2</p>
                  </div>
                </td>
              </tr>
              <tr data-row-id="2">
                <td colspan="1" data-col-id="1" data-row-id="2" rowspan="1">
                  <div data-col-id="1" data-colspan="1" data-row-id="2" data-rowspan="1">
                    <p>3</p>
                  </div>
                </td>
                <td colspan="1" data-col-id="2" data-row-id="2" rowspan="1">
                  <div data-col-id="2" data-colspan="1" data-row-id="2" data-rowspan="1">
                    <p>4</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'data-table-id', 'contenteditable'] },
    );
    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${createTableHTML(2, 2)}
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'data-table-id', 'contenteditable'] },
    );
  });

  it('undo and redo table width change', async () => {
    const quill = await createTable(3, 3, { full: false, width: 100 });
    const table = quill.root.querySelector('table')!;
    const tableBlot = Quill.find(table) as TableMainFormat;
    const cols = tableBlot.getCols();
    for (const col of cols) {
      col.width = 120;
    }
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${createTableHTML(3, 3, { full: false, width: 120 })}
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'contenteditable'] },
    );

    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${createTableHTML(3, 3, { full: false, width: 100 })}
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'contenteditable'] },
    );

    quill.history.redo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${createTableHTML(3, 3, { full: false, width: 120 })}
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'contenteditable'] },
    );
  });

  it('undo table align change', async () => {
    const quill = await createTable(3, 3, { full: false, width: 100 });
    const table = quill.root.querySelector('table')!;
    const tableBlot = Quill.find(table) as TableMainFormat;
    const cols = tableBlot.getCols();
    for (const col of cols) {
      col.align = 'center';
    }
    await vi.runAllTimersAsync();
    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" style="margin-right: auto; width: 300px;">
            ${createTaleColHTML(3, { full: false, width: 100 })}
            ${createTableBodyHTML(3, 3)}
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'data-table-id', 'contenteditable'] },
    );

    quill.history.redo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0"${datasetAlign('center')} style="margin-right: auto; width: 300px; margin-left: auto;">
            ${createTaleColHTML(3, { align: 'center', full: false, width: 100 })}
            ${createTableBodyHTML(3, 3)}
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'data-table-id', 'contenteditable'] },
    );
  });

  it('undo and redo table style and format clean by selection', async () => {
    const quill = createQuillWithTableModule('<p></p>');
    quill.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: 'jb784n9k6x', colId: '22nxu0uo4pa', full: false, width: 121 } } },
      { insert: { 'table-up-col': { tableId: 'jb784n9k6x', colId: 'bmx6pu6y5s', full: false, width: 121 } } },
      { attributes: { background: '#e60000' }, insert: '1' },
      { attributes: { 'table-up-cell-inner': { tableId: 'jb784n9k6x', rowId: 'duq5dazb08o', colId: '22nxu0uo4pa', rowspan: 1, colspan: 1, style: 'background-color: rgb(41, 114, 244);' } }, insert: '\n' },
      { insert: '2' },
      { attributes: { 'table-up-cell-inner': { tableId: 'jb784n9k6x', rowId: 'duq5dazb08o', colId: 'bmx6pu6y5s', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '3' },
      { attributes: { 'table-up-cell-inner': { tableId: 'jb784n9k6x', rowId: 'd4ckk1exgug', colId: '22nxu0uo4pa', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { italic: true, bold: true }, insert: '5555' },
      { attributes: { 'list': 'bullet', 'table-up-cell-inner': { tableId: 'jb784n9k6x', rowId: 'd4ckk1exgug', colId: 'bmx6pu6y5s', rowspan: 1, colspan: 1, style: 'background-color: rgb(49, 155, 98);' } }, insert: '\n' },
      { attributes: { italic: true, bold: true }, insert: '6666' },
      { attributes: { 'list': 'bullet', 'table-up-cell-inner': { tableId: 'jb784n9k6x', rowId: 'd4ckk1exgug', colId: 'bmx6pu6y5s', rowspan: 1, colspan: 1, style: 'background-color: rgb(49, 155, 98);' } }, insert: '\n' },
      { insert: '\n' },
    ]);

    quill.setSelection(11, 5, Quill.sources.SILENT);
    quill.theme.modules.toolbar!.handlers!.clean.call(quill.theme.modules.toolbar as any, true);
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0">
            <colgroup>
              <col width="121px" />
              <col width="121px" />
            </colgroup>
            <tbody>
              <tr>
                <td rowspan="1" colspan="1" style="background-color: rgb(41, 114, 244);">
                  <div data-style="background-color: rgb(41, 114, 244);">
                    <p><span style="background-color: rgb(230, 0, 0);">1</span></p>
                  </div>
                </td>
                <td rowspan="1" colspan="1">
                  <div>
                    <p>2</p>
                  </div>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1"><div><p>3</p></div></td>
                <td rowspan="1" colspan="1" style="background-color: rgb(49, 155, 98);">
                  <div data-style="background-color: rgb(49, 155, 98);">
                    <p><strong><em>55</em></strong>55</p>
                    <p>66<strong><em>66</em></strong></p>
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

    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0">
            <colgroup>
              <col width="121px" />
              <col width="121px" />
            </colgroup>
            <tbody>
              <tr>
                <td rowspan="1" colspan="1" style="background-color: rgb(41, 114, 244);">
                  <div data-style="background-color: rgb(41, 114, 244);">
                    <p><span style="background-color: rgb(230, 0, 0);">1</span></p>
                  </div>
                </td>
                <td rowspan="1" colspan="1">
                  <div>
                    <p>2</p>
                  </div>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1"><div><p>3</p></div></td>
                <td rowspan="1" colspan="1" style="background-color: rgb(49, 155, 98);">
                  <div data-style="background-color: rgb(49, 155, 98);">
                    <ol>
                      <li data-list="bullet"><strong><em>5555</em></strong></li>
                      <li data-list="bullet"><strong><em>6666</em></strong></li>
                    </ol>
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

    quill.history.redo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0">
            <colgroup>
              <col width="121px" />
              <col width="121px" />
            </colgroup>
            <tbody>
              <tr>
                <td rowspan="1" colspan="1" style="background-color: rgb(41, 114, 244);">
                  <div data-style="background-color: rgb(41, 114, 244);">
                    <p><span style="background-color: rgb(230, 0, 0);">1</span></p>
                  </div>
                </td>
                <td rowspan="1" colspan="1">
                  <div>
                    <p>2</p>
                  </div>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1"><div><p>3</p></div></td>
                <td rowspan="1" colspan="1" style="background-color: rgb(49, 155, 98);">
                  <div data-style="background-color: rgb(49, 155, 98);">
                    <p><strong><em>55</em></strong>55</p>
                    <p>66<strong><em>66</em></strong></p>
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

  it('undo and redo table style and format clean by TableSelection', async () => {
    const quill = createQuillWithTableModule('<p></p>', { modules: [{ module: TableSelection }] });
    quill.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: 'jb784n9k6x', colId: '22nxu0uo4pa', full: false, width: 121 } } },
      { insert: { 'table-up-col': { tableId: 'jb784n9k6x', colId: 'bmx6pu6y5s', full: false, width: 121 } } },
      { attributes: { background: '#e60000' }, insert: '1' },
      { attributes: { 'table-up-cell-inner': { tableId: 'jb784n9k6x', rowId: 'duq5dazb08o', colId: '22nxu0uo4pa', rowspan: 1, colspan: 1, style: 'background-color: rgb(41, 114, 244);' } }, insert: '\n' },
      { insert: '2' },
      { attributes: { 'table-up-cell-inner': { tableId: 'jb784n9k6x', rowId: 'duq5dazb08o', colId: 'bmx6pu6y5s', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '3' },
      { attributes: { 'table-up-cell-inner': { tableId: 'jb784n9k6x', rowId: 'd4ckk1exgug', colId: '22nxu0uo4pa', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { italic: true, bold: true }, insert: '5555' },
      { attributes: { 'list': 'bullet', 'table-up-cell-inner': { tableId: 'jb784n9k6x', rowId: 'd4ckk1exgug', colId: 'bmx6pu6y5s', rowspan: 1, colspan: 1, style: 'background-color: rgb(49, 155, 98);' } }, insert: '\n' },
      { attributes: { italic: true, bold: true }, insert: '6666' },
      { attributes: { 'list': 'bullet', 'table-up-cell-inner': { tableId: 'jb784n9k6x', rowId: 'd4ckk1exgug', colId: 'bmx6pu6y5s', rowspan: 1, colspan: 1, style: 'background-color: rgb(49, 155, 98);' } }, insert: '\n' },
      { insert: '\n' },
    ]);

    const tableUp = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    const tableSelection = tableUp.getModule<TableSelection>('table-selection');
    tableSelection!.table = quill.root.querySelector('table')!;
    tableSelection!.setSelectedTds(tds);
    quill.theme.modules.toolbar!.handlers!.clean.call(quill.theme.modules.toolbar as any, true);
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0">
            <colgroup>
              <col width="121px" />
              <col width="121px" />
            </colgroup>
            <tbody>
              <tr>
                <td rowspan="1" colspan="1">
                  <div>
                    <p>1</p>
                  </div>
                </td>
                <td rowspan="1" colspan="1">
                  <div>
                    <p>2</p>
                  </div>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1"><div><p>3</p></div></td>
                <td rowspan="1" colspan="1">
                  <div>
                    <p>5555</p>
                    <p>6666</p>
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

    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0">
            <colgroup>
              <col width="121px" />
              <col width="121px" />
            </colgroup>
            <tbody>
              <tr>
                <td rowspan="1" colspan="1" style="background-color: rgb(41, 114, 244);">
                  <div data-style="background-color: rgb(41, 114, 244);">
                    <p><span style="background-color: rgb(230, 0, 0);">1</span></p>
                  </div>
                </td>
                <td rowspan="1" colspan="1">
                  <div>
                    <p>2</p>
                  </div>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1"><div><p>3</p></div></td>
                <td rowspan="1" colspan="1" style="background-color: rgb(49, 155, 98);">
                  <div data-style="background-color: rgb(49, 155, 98);">
                    <ol>
                      <li data-list="bullet"><strong><em>5555</em></strong></li>
                      <li data-list="bullet"><strong><em>6666</em></strong></li>
                    </ol>
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

    quill.history.redo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0">
            <colgroup>
              <col width="121px" />
              <col width="121px" />
            </colgroup>
            <tbody>
              <tr>
                <td rowspan="1" colspan="1">
                  <div>
                    <p>1</p>
                  </div>
                </td>
                <td rowspan="1" colspan="1">
                  <div>
                    <p>2</p>
                  </div>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1"><div><p>3</p></div></td>
                <td rowspan="1" colspan="1">
                  <div>
                    <p>5555</p>
                    <p>6666</p>
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

  it('undo table style with Container in cell', async () => {
    const quill = await createTable(3, 3);
    quill.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: 'wm7stgtxmn', colId: 'vm3doxdsmq', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: 'wm7stgtxmn', colId: 'k4ele1u8u4n', full: false, width: 100 } } },
      { insert: '1' },
      { attributes: { 'list': 'unchecked', 'table-up-cell-inner': { tableId: 'wm7stgtxmn', rowId: 'xn7r03opjc', colId: 'vm3doxdsmq', rowspan: 1, colspan: 1 } }, insert: '\n\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'wm7stgtxmn', rowId: 'xn7r03opjc', colId: 'k4ele1u8u4n', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'wm7stgtxmn', rowId: 'nqpe206omjn', colId: 'vm3doxdsmq', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'wm7stgtxmn', rowId: 'nqpe206omjn', colId: 'k4ele1u8u4n', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);
    await vi.runAllTimersAsync();

    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.setCellAttrs([tds[0]], 'background-color', 'rgb(0, 163, 245)', true);
    await vi.runAllTimersAsync();
    expectDelta(
      quill.getContents(),
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { tableId: 'wm7stgtxmn', colId: 'vm3doxdsmq', full: false, width: 100 } } },
        { insert: { 'table-up-col': { tableId: 'wm7stgtxmn', colId: 'k4ele1u8u4n', full: false, width: 100 } } },
        { insert: '1' },
        { attributes: { 'list': 'unchecked', 'table-up-cell-inner': { tableId: 'wm7stgtxmn', rowId: 'xn7r03opjc', colId: 'vm3doxdsmq', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody', style: 'background-color: rgb(0, 163, 245);' } }, insert: '\n\n' },
        { attributes: { 'table-up-cell-inner': { tableId: 'wm7stgtxmn', rowId: 'xn7r03opjc', colId: 'k4ele1u8u4n', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: 'wm7stgtxmn', rowId: 'nqpe206omjn', colId: 'vm3doxdsmq', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: 'wm7stgtxmn', rowId: 'nqpe206omjn', colId: 'k4ele1u8u4n', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { insert: '\n' },
      ]),
    );

    quill.history.undo();
    await vi.runAllTimersAsync();
    expectDelta(
      quill.getContents(),
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { tableId: 'wm7stgtxmn', colId: 'vm3doxdsmq', full: false, width: 100 } } },
        { insert: { 'table-up-col': { tableId: 'wm7stgtxmn', colId: 'k4ele1u8u4n', full: false, width: 100 } } },
        { insert: '1' },
        { attributes: { 'list': 'unchecked', 'table-up-cell-inner': { tableId: 'wm7stgtxmn', rowId: 'xn7r03opjc', colId: 'vm3doxdsmq', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n\n' },
        { attributes: { 'table-up-cell-inner': { tableId: 'wm7stgtxmn', rowId: 'xn7r03opjc', colId: 'k4ele1u8u4n', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: 'wm7stgtxmn', rowId: 'nqpe206omjn', colId: 'vm3doxdsmq', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: 'wm7stgtxmn', rowId: 'nqpe206omjn', colId: 'k4ele1u8u4n', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { insert: '\n' },
      ]),
    );

    quill.history.redo();
    await vi.runAllTimersAsync();
    expectDelta(
      quill.getContents(),
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { tableId: 'wm7stgtxmn', colId: 'vm3doxdsmq', full: false, width: 100 } } },
        { insert: { 'table-up-col': { tableId: 'wm7stgtxmn', colId: 'k4ele1u8u4n', full: false, width: 100 } } },
        { insert: '1' },
        { attributes: { 'list': 'unchecked', 'table-up-cell-inner': { tableId: 'wm7stgtxmn', rowId: 'xn7r03opjc', colId: 'vm3doxdsmq', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody', style: 'background-color: rgb(0, 163, 245);' } }, insert: '\n\n' },
        { attributes: { 'table-up-cell-inner': { tableId: 'wm7stgtxmn', rowId: 'xn7r03opjc', colId: 'k4ele1u8u4n', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: 'wm7stgtxmn', rowId: 'nqpe206omjn', colId: 'vm3doxdsmq', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: 'wm7stgtxmn', rowId: 'nqpe206omjn', colId: 'k4ele1u8u4n', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { insert: '\n' },
      ]),
    );
  });

  it('undo table style and list in cell', async () => {
    const quill = await createTable(3, 3);
    quill.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);
    await vi.runAllTimersAsync();

    quill.updateContents([{ retain: 3 }, { retain: 1, attributes: { list: 'unchecked' } }]);
    quill.updateContents([{ retain: 3 }, { insert: '123' }]);
    quill.updateContents([{ retain: 6 }, { retain: 1, attributes: { list: 'checked' } }]);
    quill.updateContents(
      [
        { retain: 7 },
        { retain: 1, attributes: { 'list': 'unchecked', 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td' } } },
        { retain: 1, attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1, tag: 'td' } } },
        { retain: 1, attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1, tag: 'td' } } },
        { retain: 1, attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1, tag: 'td' } } },
        { insert: '\n' },
      ],
    );

    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.setCellAttrs([tds[0]], 'border-color', 'red', true);
    await vi.runAllTimersAsync();

    expectDelta(
      quill.getContents(),
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
        { insert: '123' },
        { attributes: { 'list': 'checked', 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody', style: 'border-color: red;' } }, insert: '\n' },
        { attributes: { 'list': 'unchecked', 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody', style: 'border-color: red;' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { insert: '\n' },
      ]),
    );

    quill.history.undo();
    expectDelta(
      quill.getContents(),
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
        { insert: '123' },
        { attributes: { 'list': 'checked', 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { attributes: { 'list': 'unchecked', 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { insert: '\n' },
      ]),
    );

    quill.history.undo();
    expectDelta(
      quill.getContents(),
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
        { insert: '123' },
        { attributes: { 'list': 'checked', 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { insert: '\n' },
      ]),
    );

    quill.history.undo();
    expectDelta(
      quill.getContents(),
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
        { insert: '123' },
        { attributes: { 'list': 'unchecked', 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { insert: '\n' },
      ]),
    );

    quill.history.undo();
    expectDelta(
      quill.getContents(),
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
        { attributes: { 'list': 'unchecked', 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { insert: '\n' },
      ]),
    );

    quill.history.undo();
    expectDelta(
      quill.getContents(),
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { insert: '\n' },
      ]),
    );
  });
});

describe('table caption', () => {
  it('undo and redo tableCaption insert', async () => {
    const quill = await createTable(3, 3, { full: false });
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    await vi.runAllTimersAsync();
    const table = quill.root.querySelector('table')!;
    (tableMenuTools.InsertCaption as ToolOption).handle.call({ quill, table } as any, tableModule, [], null);
    await vi.runAllTimersAsync();
    const tableCaptionDelta = new Delta([
      { insert: '\nTable Caption' },
      { attributes: { 'table-up-caption': { tableId: '1', side: 'top' } }, insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 100 } } },
      { insert: '1' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '2' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '3' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '4' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '5' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '6' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '7' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '8' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '9' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);
    expectDelta(
      tableCaptionDelta,
      quill.getContents(),
    );

    quill.history.undo();
    await vi.runAllTimersAsync();
    expectDelta(
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 100 } } },
        { insert: '1' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '2' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '3' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '4' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '5' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '6' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '7' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '8' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '9' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '\n' },
      ]),
      quill.getContents(),
    );

    quill.history.redo();
    await vi.runAllTimersAsync();
    expectDelta(
      tableCaptionDelta,
      quill.getContents(),
    );
  });

  it('undo and redo tableCaption edit', async () => {
    const quill = await createTable(3, 3, { full: false });
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    await vi.runAllTimersAsync();
    const table = quill.root.querySelector('table')!;
    (tableMenuTools.InsertCaption as ToolOption).handle.call({ quill, table } as any, tableModule, [], null);
    await vi.runAllTimersAsync();
    quill.deleteText({ index: 2, length: 4 });
    await vi.runAllTimersAsync();
    const tableCaptionDelta = new Delta([
      { insert: '\nT Caption' },
      { attributes: { 'table-up-caption': { tableId: '1', side: 'top' } }, insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 100 } } },
      { insert: '1' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '2' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '3' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '4' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '5' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '6' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '7' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '8' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '9' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);
    expectDelta(
      tableCaptionDelta,
      quill.getContents(),
    );

    quill.history.undo();
    await vi.runAllTimersAsync();
    expectDelta(
      new Delta([
        { insert: '\nTable Caption' },
        { attributes: { 'table-up-caption': { tableId: '1', side: 'top' } }, insert: '\n' },
        { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 100 } } },
        { insert: '1' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '2' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '3' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '4' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '5' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '6' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '7' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '8' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '9' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '\n' },
      ]),
      quill.getContents(),
    );

    quill.history.redo();
    await vi.runAllTimersAsync();
    expectDelta(
      tableCaptionDelta,
      quill.getContents(),
    );
  });

  it('undo and redo tableCaption position switch', async () => {
    const quill = await createTable(3, 3, { full: false });
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    await vi.runAllTimersAsync();
    const table = quill.root.querySelector('table')!;
    (tableMenuTools.InsertCaption as ToolOption).handle.call({ quill, table } as any, tableModule, [], null);
    await vi.runAllTimersAsync();

    const tableCaption = Quill.find(table.querySelector('caption')!)! as TableCaptionFormat;
    expect(tableCaption).not.toBeNull();
    tableCaption.side = 'bottom';
    await vi.runAllTimersAsync();
    const tableCaptionDelta = new Delta([
      { insert: '\nTable Caption' },
      { attributes: { 'table-up-caption': { tableId: '1', side: 'bottom' } }, insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 100 } } },
      { insert: '1' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '2' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '3' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '4' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '5' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '6' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '7' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '8' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '9' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);
    expectDelta(
      tableCaptionDelta,
      quill.getContents(),
    );

    quill.history.undo();
    await vi.runAllTimersAsync();
    expectDelta(
      new Delta([
        { insert: '\nTable Caption' },
        { attributes: { 'table-up-caption': { tableId: '1', side: 'top' } }, insert: '\n' },
        { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 100 } } },
        { insert: '1' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '2' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '3' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '4' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '5' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '6' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '7' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '8' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '9' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '\n' },
      ]),
      quill.getContents(),
    );

    quill.history.redo();
    await vi.runAllTimersAsync();
    expectDelta(
      tableCaptionDelta,
      quill.getContents(),
    );
  });
});

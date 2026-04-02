import Quill from 'quill';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TableCellInnerFormat } from '../../formats';
import { TableUp } from '../../table-up';
import { parseCSSRules } from '../../utils';
import { createQuillWithTableModule, createTableBodyHTML, createTableCaptionHTML, createTableDeltaOps, createTableHTML, createTaleColHTML, datasetTag, expectDelta, replaceAttrEmptyRow, simulatePasteHTML } from './utils';

const Delta = Quill.import('delta');

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('clipboard cell structure', () => {
  it('clipboard convert table', async () => {
    Quill.register({ [`modules/${TableUp.moduleName}`]: TableUp }, true);
    const container = document.body.appendChild(document.createElement('div'));
    const quill = new Quill(container);
    quill.setContents(
      quill.clipboard.convert({
        html: '<div class="ql-table-wrapper" data-table-id="1"><table class="ql-table" data-table-id="1" cellpadding="0" cellspacing="0" style="margin-right: auto; width: 300px;"><colgroup data-table-id="1" contenteditable="false"><col width="100px" data-table-id="1" data-col-id="1"><col width="100px" data-table-id="1" data-col-id="2"><col width="100px" data-table-id="1" data-col-id="3"></colgroup><tbody data-table-id="1"><tr class="ql-table-row" data-table-id="1" data-row-id="1"><td class="ql-table-cell" data-table-id="1" data-row-id="1" data-col-id="1" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="1" data-col-id="1" data-rowspan="1" data-colspan="1"><p>1</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="1" data-col-id="2" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="1" data-col-id="2" data-rowspan="1" data-colspan="1"><p>2</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="1" data-col-id="3" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="1" data-col-id="3" data-rowspan="1" data-colspan="1"><p>3</p></div></td></tr><tr class="ql-table-row" data-table-id="1" data-row-id="2"><td class="ql-table-cell" data-table-id="1" data-row-id="2" data-col-id="1" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="2" data-col-id="1" data-rowspan="1" data-colspan="1"><p>4</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="2" data-col-id="2" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="2" data-col-id="2" data-rowspan="1" data-colspan="1"><p>5</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="2" data-col-id="3" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="2" data-col-id="3" data-rowspan="1" data-colspan="1"><p>6</p></div></td></tr><tr class="ql-table-row" data-table-id="1" data-row-id="3"><td class="ql-table-cell" data-table-id="1" data-row-id="3" data-col-id="1" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="3" data-col-id="1" data-rowspan="1" data-colspan="1"><p>7</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="3" data-col-id="2" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="3" data-col-id="2" data-rowspan="1" data-colspan="1"><p>8</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="3" data-col-id="3" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="3" data-col-id="3" data-rowspan="1" data-colspan="1"><p>9</p></div></td></tr></tbody></table></div>',
      }),
    );
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${createTableHTML(3, 3, { width: 100, full: false }, undefined, { isEmpty: false })}
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'contenteditable'] },
    );
  });

  it('clipboard convert simple row merged cell', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(
      quill.clipboard.convert({
        html: '<div class="ql-table-wrapper" data-table-id="1"><table class="ql-table" data-table-id="1" cellpadding="0" cellspacing="0" style="margin-right: auto; width: 300px;"><colgroup data-table-id="1" contenteditable="false"><col width="100px" data-table-id="1" data-col-id="1"><col width="100px" data-table-id="1" data-col-id="2"><col width="100px" data-table-id="1" data-col-id="3"></colgroup><tbody data-table-id="1"><tr class="ql-table-row" data-table-id="1" data-row-id="1"><td class="ql-table-cell" data-table-id="1" data-row-id="1" data-col-id="1" rowspan="2" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="1" data-col-id="1" data-rowspan="2" data-colspan="1"><p>1</p><p>4</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="1" data-col-id="2" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="1" data-col-id="2" data-rowspan="1" data-colspan="1"><p>2</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="1" data-col-id="3" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="1" data-col-id="3" data-rowspan="1" data-colspan="1"><p>3</p></div></td></tr><tr class="ql-table-row" data-table-id="1" data-row-id="2"><td class="ql-table-cell" data-table-id="1" data-row-id="2" data-col-id="2" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="2" data-col-id="2" data-rowspan="1" data-colspan="1"><p>5</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="2" data-col-id="3" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="2" data-col-id="3" data-rowspan="1" data-colspan="1"><p>6</p></div></td></tr><tr class="ql-table-row" data-table-id="1" data-row-id="3"><td class="ql-table-cell" data-table-id="1" data-row-id="3" data-col-id="1" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="3" data-col-id="1" data-rowspan="1" data-colspan="1"><p>7</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="3" data-col-id="2" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="3" data-col-id="2" data-rowspan="1" data-colspan="1"><p>8</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="3" data-col-id="3" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="3" data-col-id="3" data-rowspan="1" data-colspan="1"><p>9</p></div></td></tr></tbody></table></div>',
      }),
    );
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0">
            <colgroup contenteditable="false">
              <col width="100px">
              <col width="100px">
              <col width="100px">
            </colgroup>
            <tbody>
              <tr>
                <td rowspan="2" colspan="1">
                  <div data-rowspan="2" data-colspan="1"><p>1</p><p>4</p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p>2</p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p>3</p></div>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p>5</p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p>6</p></div>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p>7</p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p>8</p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p>9</p></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'contenteditable'] },
    );
  });

  it('clipboard convert multiple merged cell', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(
      quill.clipboard.convert({
        html: '<div class="ql-table-wrapper" data-table-id="20qbgq25yls"><table class="ql-table" data-table-id="20qbgq25yls" cellpadding="0" cellspacing="0" style="margin-right: auto; width: 552px;"><colgroup data-table-id="20qbgq25yls" contenteditable="false"><col width="92px" data-table-id="20qbgq25yls" data-col-id="koogcnquztb"><col width="92px" data-table-id="20qbgq25yls" data-col-id="f79h4ztxj8q"><col width="92px" data-table-id="20qbgq25yls" data-col-id="5gs6eve67e"><col width="92px" data-table-id="20qbgq25yls" data-col-id="4h2hpevrsri"><col width="92px" data-table-id="20qbgq25yls" data-col-id="7oxn7r6w1pt"><col width="92px" data-table-id="20qbgq25yls" data-col-id="gr9shrjb22u"></colgroup><tbody data-table-id="20qbgq25yls"><tr class="ql-table-row" data-table-id="20qbgq25yls" data-row-id="xokhdrqgaep"><td class="ql-table-cell" data-table-id="20qbgq25yls" data-row-id="xokhdrqgaep" data-col-id="koogcnquztb" rowspan="3" colspan="4"><div class="ql-table-cell-inner" data-table-id="20qbgq25yls" data-row-id="xokhdrqgaep" data-col-id="koogcnquztb" data-rowspan="3" data-colspan="4"><p><br></p></div></td><td class="ql-table-cell" data-table-id="20qbgq25yls" data-row-id="xokhdrqgaep" data-col-id="7oxn7r6w1pt" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="20qbgq25yls" data-row-id="xokhdrqgaep" data-col-id="7oxn7r6w1pt" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="20qbgq25yls" data-row-id="xokhdrqgaep" data-col-id="gr9shrjb22u" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="20qbgq25yls" data-row-id="xokhdrqgaep" data-col-id="gr9shrjb22u" data-rowspan="1" data-colspan="1"><p><br></p></div></td></tr><tr class="ql-table-row" data-table-id="20qbgq25yls" data-row-id="3jm31cjuty2"><td class="ql-table-cell" data-table-id="20qbgq25yls" data-row-id="3jm31cjuty2" data-col-id="7oxn7r6w1pt" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="20qbgq25yls" data-row-id="3jm31cjuty2" data-col-id="7oxn7r6w1pt" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="20qbgq25yls" data-row-id="3jm31cjuty2" data-col-id="gr9shrjb22u" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="20qbgq25yls" data-row-id="3jm31cjuty2" data-col-id="gr9shrjb22u" data-rowspan="1" data-colspan="1"><p><br></p></div></td></tr><tr class="ql-table-row" data-table-id="20qbgq25yls" data-row-id="upc6c7so57s"><td class="ql-table-cell" data-table-id="20qbgq25yls" data-row-id="upc6c7so57s" data-col-id="7oxn7r6w1pt" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="20qbgq25yls" data-row-id="upc6c7so57s" data-col-id="7oxn7r6w1pt" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="20qbgq25yls" data-row-id="upc6c7so57s" data-col-id="gr9shrjb22u" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="20qbgq25yls" data-row-id="upc6c7so57s" data-col-id="gr9shrjb22u" data-rowspan="1" data-colspan="1"><p><br></p></div></td></tr><tr class="ql-table-row" data-table-id="20qbgq25yls" data-row-id="tbdchag52d"><td class="ql-table-cell" data-table-id="20qbgq25yls" data-row-id="tbdchag52d" data-col-id="koogcnquztb" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="20qbgq25yls" data-row-id="tbdchag52d" data-col-id="koogcnquztb" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="20qbgq25yls" data-row-id="tbdchag52d" data-col-id="f79h4ztxj8q" rowspan="2" colspan="4"><div class="ql-table-cell-inner" data-table-id="20qbgq25yls" data-row-id="tbdchag52d" data-col-id="f79h4ztxj8q" data-rowspan="2" data-colspan="4"><p><br></p></div></td><td class="ql-table-cell" data-table-id="20qbgq25yls" data-row-id="tbdchag52d" data-col-id="gr9shrjb22u" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="20qbgq25yls" data-row-id="tbdchag52d" data-col-id="gr9shrjb22u" data-rowspan="1" data-colspan="1"><p><br></p></div></td></tr><tr class="ql-table-row" data-table-id="20qbgq25yls" data-row-id="8w13n0houz4"><td class="ql-table-cell" data-table-id="20qbgq25yls" data-row-id="8w13n0houz4" data-col-id="koogcnquztb" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="20qbgq25yls" data-row-id="8w13n0houz4" data-col-id="koogcnquztb" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="20qbgq25yls" data-row-id="8w13n0houz4" data-col-id="gr9shrjb22u" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="20qbgq25yls" data-row-id="8w13n0houz4" data-col-id="gr9shrjb22u" data-rowspan="1" data-colspan="1"><p><br></p></div></td></tr><tr class="ql-table-row" data-table-id="20qbgq25yls" data-row-id="wtadizd3fdb"><td class="ql-table-cell" data-table-id="20qbgq25yls" data-row-id="wtadizd3fdb" data-col-id="koogcnquztb" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="20qbgq25yls" data-row-id="wtadizd3fdb" data-col-id="koogcnquztb" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="20qbgq25yls" data-row-id="wtadizd3fdb" data-col-id="f79h4ztxj8q" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="20qbgq25yls" data-row-id="wtadizd3fdb" data-col-id="f79h4ztxj8q" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="20qbgq25yls" data-row-id="wtadizd3fdb" data-col-id="5gs6eve67e" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="20qbgq25yls" data-row-id="wtadizd3fdb" data-col-id="5gs6eve67e" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="20qbgq25yls" data-row-id="wtadizd3fdb" data-col-id="4h2hpevrsri" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="20qbgq25yls" data-row-id="wtadizd3fdb" data-col-id="4h2hpevrsri" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="20qbgq25yls" data-row-id="wtadizd3fdb" data-col-id="7oxn7r6w1pt" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="20qbgq25yls" data-row-id="wtadizd3fdb" data-col-id="7oxn7r6w1pt" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="20qbgq25yls" data-row-id="wtadizd3fdb" data-col-id="gr9shrjb22u" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="20qbgq25yls" data-row-id="wtadizd3fdb" data-col-id="gr9shrjb22u" data-rowspan="1" data-colspan="1"><p><br></p></div></td></tr></tbody></table></div>',
      }),
    );
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0">
            ${createTaleColHTML(6, { width: 92, full: false })}
            <tbody>
              <tr>
                <td rowspan="3" colspan="4">
                  <div data-rowspan="3" data-colspan="4"><p><br></p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
                <td rowspan="2" colspan="4">
                  <div data-rowspan="2" data-colspan="4"><p><br></p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'contenteditable'] },
    );
  });

  it('clipboard convert multiple merged cell 2', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(
      quill.clipboard.convert({
        html: '<div class="ql-table-wrapper" data-table-id="jtgjjhsazan"><table class="ql-table" data-table-id="jtgjjhsazan" cellpadding="0" cellspacing="0" style="margin-right: auto; width: 1015px;"><colgroup data-table-id="jtgjjhsazan" contenteditable="false"><col width="145px" data-table-id="jtgjjhsazan" data-col-id="lcqe1oszz2d"><col width="145px" data-table-id="jtgjjhsazan" data-col-id="3gexyky3l85"><col width="145px" data-table-id="jtgjjhsazan" data-col-id="u4mwvxbsbbe"><col width="145px" data-table-id="jtgjjhsazan" data-col-id="ut2zlf9nhmn"><col width="145px" data-table-id="jtgjjhsazan" data-col-id="1b9m3f8tz77"><col width="145px" data-table-id="jtgjjhsazan" data-col-id="yt3fiis74wf"><col width="145px" data-table-id="jtgjjhsazan" data-col-id="2n9x1ugvy1p"></colgroup><tbody data-table-id="jtgjjhsazan"><tr class="ql-table-row" data-table-id="jtgjjhsazan" data-row-id="jbrlyb47l4"><td class="ql-table-cell" data-table-id="jtgjjhsazan" data-row-id="jbrlyb47l4" data-col-id="lcqe1oszz2d" rowspan="2" colspan="3"><div class="ql-table-cell-inner" data-table-id="jtgjjhsazan" data-row-id="jbrlyb47l4" data-col-id="lcqe1oszz2d" data-rowspan="2" data-colspan="3"><p><br></p></div></td><td class="ql-table-cell" data-table-id="jtgjjhsazan" data-row-id="jbrlyb47l4" data-col-id="ut2zlf9nhmn" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="jtgjjhsazan" data-row-id="jbrlyb47l4" data-col-id="ut2zlf9nhmn" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="jtgjjhsazan" data-row-id="jbrlyb47l4" data-col-id="1b9m3f8tz77" rowspan="2" colspan="3"><div class="ql-table-cell-inner" data-table-id="jtgjjhsazan" data-row-id="jbrlyb47l4" data-col-id="1b9m3f8tz77" data-rowspan="2" data-colspan="3"><p><br></p></div></td></tr><tr class="ql-table-row" data-table-id="jtgjjhsazan" data-row-id="s2x86miz6ke"><td class="ql-table-cell" data-table-id="jtgjjhsazan" data-row-id="s2x86miz6ke" data-col-id="ut2zlf9nhmn" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="jtgjjhsazan" data-row-id="s2x86miz6ke" data-col-id="ut2zlf9nhmn" data-rowspan="1" data-colspan="1"><p><br></p></div></td></tr><tr class="ql-table-row" data-table-id="jtgjjhsazan" data-row-id="seartuzbg8"><td class="ql-table-cell" data-table-id="jtgjjhsazan" data-row-id="seartuzbg8" data-col-id="lcqe1oszz2d" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="jtgjjhsazan" data-row-id="seartuzbg8" data-col-id="lcqe1oszz2d" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="jtgjjhsazan" data-row-id="seartuzbg8" data-col-id="3gexyky3l85" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="jtgjjhsazan" data-row-id="seartuzbg8" data-col-id="3gexyky3l85" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="jtgjjhsazan" data-row-id="seartuzbg8" data-col-id="u4mwvxbsbbe" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="jtgjjhsazan" data-row-id="seartuzbg8" data-col-id="u4mwvxbsbbe" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="jtgjjhsazan" data-row-id="seartuzbg8" data-col-id="ut2zlf9nhmn" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="jtgjjhsazan" data-row-id="seartuzbg8" data-col-id="ut2zlf9nhmn" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="jtgjjhsazan" data-row-id="seartuzbg8" data-col-id="1b9m3f8tz77" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="jtgjjhsazan" data-row-id="seartuzbg8" data-col-id="1b9m3f8tz77" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="jtgjjhsazan" data-row-id="seartuzbg8" data-col-id="yt3fiis74wf" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="jtgjjhsazan" data-row-id="seartuzbg8" data-col-id="yt3fiis74wf" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="jtgjjhsazan" data-row-id="seartuzbg8" data-col-id="2n9x1ugvy1p" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="jtgjjhsazan" data-row-id="seartuzbg8" data-col-id="2n9x1ugvy1p" data-rowspan="1" data-colspan="1"><p><br></p></div></td></tr></tbody></table></div>',
      }),
    );
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0">
            ${createTaleColHTML(7, { width: 145, full: false })}
            <tbody>
              <tr>
                <td rowspan="2" colspan="3">
                  <div data-rowspan="2" data-colspan="3"><p><br></p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
                <td rowspan="2" colspan="3">
                  <div data-rowspan="2" data-colspan="3"><p><br></p></div>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'contenteditable'] },
    );
  });

  it('clipboard convert multiple merged cell 3', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, { full: false });
    quill.setContents(
      quill.clipboard.convert({
        html: '<table><tbody><tr><td rowspan="3">merge1</td><td colspan="2">merge2</td><td>3</td></tr><tr><td rowspan="2">merge3</td><td>1</td><td>4</td></tr><tr><td>2</td><td>5</td></tr></tbody></table>',
      }),
    );
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0">
            ${createTaleColHTML(4, { width: 100, full: false })}
            <tbody>
              <tr>
                <td rowspan="3" colspan="1">
                  <div data-rowspan="3" data-colspan="1"><p>merge1</p></div>
                </td>
                <td rowspan="1" colspan="2">
                  <div data-rowspan="1" data-colspan="2"><p>merge2</p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p>3</p></div>
                </td>
              </tr>
              <tr>
                <td rowspan="2" colspan="1">
                  <div data-rowspan="2" data-colspan="1"><p>merge3</p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p>1</p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p>4</p></div>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p>2</p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p>5</p></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'contenteditable'] },
    );
  });

  it('clipboard convert table without new line', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(
      quill.clipboard.convert({
        html: '<p>123</p><div class="ql-table-wrapper" data-table-id="1"><table class="ql-table" data-table-id="1" cellpadding="0" cellspacing="0" style="margin-right: auto; width: 300px;"><colgroup data-table-id="1" contenteditable="false"><col width="100px" data-table-id="1" data-col-id="1"><col width="100px" data-table-id="1" data-col-id="2"><col width="100px" data-table-id="1" data-col-id="3"></colgroup><tbody data-table-id="1"><tr class="ql-table-row" data-table-id="1" data-row-id="1"><td class="ql-table-cell" data-table-id="1" data-row-id="1" data-col-id="1" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="1" data-col-id="1" data-rowspan="1" data-colspan="1"><p>1</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="1" data-col-id="2" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="1" data-col-id="2" data-rowspan="1" data-colspan="1"><p>2</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="1" data-col-id="3" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="1" data-col-id="3" data-rowspan="1" data-colspan="1"><p>3</p></div></td></tr><tr class="ql-table-row" data-table-id="1" data-row-id="2"><td class="ql-table-cell" data-table-id="1" data-row-id="2" data-col-id="1" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="2" data-col-id="1" data-rowspan="1" data-colspan="1"><p>4</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="2" data-col-id="2" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="2" data-col-id="2" data-rowspan="1" data-colspan="1"><p>5</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="2" data-col-id="3" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="2" data-col-id="3" data-rowspan="1" data-colspan="1"><p>6</p></div></td></tr><tr class="ql-table-row" data-table-id="1" data-row-id="3"><td class="ql-table-cell" data-table-id="1" data-row-id="3" data-col-id="1" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="3" data-col-id="1" data-rowspan="1" data-colspan="1"><p>7</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="3" data-col-id="2" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="3" data-col-id="2" data-rowspan="1" data-colspan="1"><p>8</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="3" data-col-id="3" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="3" data-col-id="3" data-rowspan="1" data-colspan="1"><p>9</p></div></td></tr></tbody></table></div><p>123</p>',
      }),
    );
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p>123</p>
        ${createTableHTML(3, 3, { width: 100, full: false }, undefined, { isEmpty: false })}
        <p>123</p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'contenteditable'] },
    );
  });

  it('clipboard convert cell border', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(
      quill.clipboard.convert({
        html: `<div class="ql-table-wrapper" data-table-id="5pi2un7zknv" contenteditable="false">
          <table class="ql-table" data-table-id="5pi2un7zknv" data-full="true" cellpadding="0" cellspacing="0" style="margin-right: auto;">
            <colgroup data-table-id="5pi2un7zknv" data-full="true" contenteditable="false">
              <col width="50%" data-full="true" data-table-id="5pi2un7zknv" data-col-id="eo2512o36cf">
              <col width="50%" data-full="true" data-table-id="5pi2un7zknv" data-col-id="xyb8tsffasd">
            </colgroup><tbody data-table-id="5pi2un7zknv">
              <tr class="ql-table-row" data-table-id="5pi2un7zknv" data-row-id="i3fzy8p0yya">
                <td class="ql-table-cell" data-table-id="5pi2un7zknv" data-row-id="i3fzy8p0yya" data-col-id="eo2512o36cf" rowspan="1" colspan="1" style="border-color: transparent;">
                  <div class="ql-table-cell-inner" data-table-id="5pi2un7zknv" data-row-id="i3fzy8p0yya" data-col-id="eo2512o36cf" data-rowspan="1" data-colspan="1" data-style="border-top-color:transparent;border-right-color:transparent;border-bottom-color:transparent;border-left-color:transparent" contenteditable="true">
                    <p><strong>Col 1</strong></p>
                  </div>
                </td>
                <td class="ql-table-cell" data-table-id="5pi2un7zknv" data-row-id="i3fzy8p0yya" data-col-id="xyb8tsffasd" rowspan="1" colspan="1" style="border-color: transparent;">
                  <div class="ql-table-cell-inner" data-table-id="5pi2un7zknv" data-row-id="i3fzy8p0yya" data-col-id="xyb8tsffasd" data-rowspan="1" data-colspan="1" data-style="border-top-color:transparent;border-right-color:transparent;border-bottom-color:transparent;border-left-color:transparent" contenteditable="true">
                    <p class="ql-align-right"><strong>Data 1</strong></p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>`,
      }),
    );
    await vi.runAllTimersAsync();
    // string convert html style have different behavior. in node will merge same attribute
    // like: border-left-color:;border-right-color:;border-top-color:;border-bottom-color:; will merge to border-color:;
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table data-full="true" cellpadding="0" cellspacing="0" style="margin-right: auto;">
            <colgroup data-full="true">
              <col width="50%" data-full="true">
              <col width="50%" data-full="true">
            </colgroup>
            <tbody>
              <tr>
                <td rowspan="1" colspan="1" style="border-color: transparent;">
                  <div data-style="border-color: transparent;">
                    <p><strong>Col 1</strong></p>
                  </div>
                </td>
                <td rowspan="1" colspan="1" style="border-color: transparent;">
                  <div data-style="border-color: transparent;">
                    <p class="ql-align-right"><strong>Data 1</strong></p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });

  it('clipboard convert cell border with different cell', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(
      quill.clipboard.convert({
        html: `<div class="ql-table-wrapper" data-table-id="net6rvnou1" contenteditable="false"><table class="ql-table" data-table-id="net6rvnou1" cellpadding="0" cellspacing="0" style="margin-right: auto; width: 633px;"><colgroup data-table-id="net6rvnou1" contenteditable="false"><col width="211px" data-table-id="net6rvnou1" data-col-id="k2gt5etndq"><col width="211px" data-table-id="net6rvnou1" data-col-id="9w3nt695har"><col width="211px" data-table-id="net6rvnou1" data-col-id="p6yitoe294"></colgroup><tbody data-table-id="net6rvnou1"><tr class="ql-table-row" data-table-id="net6rvnou1" data-row-id="6zdnloahiv"><td class="ql-table-cell" data-table-id="net6rvnou1" data-row-id="6zdnloahiv" data-col-id="k2gt5etndq" rowspan="1" colspan="1" style="border-color: transparent;"><div class="ql-table-cell-inner" data-table-id="net6rvnou1" data-row-id="6zdnloahiv" data-col-id="k2gt5etndq" data-rowspan="1" data-colspan="1" contenteditable="true" data-style="border-color: transparent;"><p><br></p></div></td><td class="ql-table-cell" data-table-id="net6rvnou1" data-row-id="6zdnloahiv" data-col-id="9w3nt695har" rowspan="1" colspan="1" style="border-bottom-color: transparent;"><div class="ql-table-cell-inner" data-table-id="net6rvnou1" data-row-id="6zdnloahiv" data-col-id="9w3nt695har" data-rowspan="1" data-colspan="1" contenteditable="true" data-style="border-bottom-color: transparent;"><p><br></p></div></td><td class="ql-table-cell" data-table-id="net6rvnou1" data-row-id="6zdnloahiv" data-col-id="p6yitoe294" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="net6rvnou1" data-row-id="6zdnloahiv" data-col-id="p6yitoe294" data-rowspan="1" data-colspan="1" contenteditable="true"><p><br></p></div></td></tr><tr class="ql-table-row" data-table-id="net6rvnou1" data-row-id="ikpx3beeyx"><td class="ql-table-cell" data-table-id="net6rvnou1" data-row-id="ikpx3beeyx" data-col-id="k2gt5etndq" rowspan="1" colspan="1" style="border-right-color: transparent;"><div class="ql-table-cell-inner" data-table-id="net6rvnou1" data-row-id="ikpx3beeyx" data-col-id="k2gt5etndq" data-rowspan="1" data-colspan="1" contenteditable="true" data-style="border-right-color: transparent;"><p><br></p></div></td><td class="ql-table-cell" data-table-id="net6rvnou1" data-row-id="ikpx3beeyx" data-col-id="9w3nt695har" rowspan="1" colspan="1" style="border-color: transparent;"><div class="ql-table-cell-inner" data-table-id="net6rvnou1" data-row-id="ikpx3beeyx" data-col-id="9w3nt695har" data-rowspan="1" data-colspan="1" contenteditable="true" data-style="border-color: transparent;"><p><br></p></div></td><td class="ql-table-cell" data-table-id="net6rvnou1" data-row-id="ikpx3beeyx" data-col-id="p6yitoe294" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="net6rvnou1" data-row-id="ikpx3beeyx" data-col-id="p6yitoe294" data-rowspan="1" data-colspan="1" contenteditable="true"><p><br></p></div></td></tr><tr class="ql-table-row" data-table-id="net6rvnou1" data-row-id="hlgvikp39ps"><td class="ql-table-cell" data-table-id="net6rvnou1" data-row-id="hlgvikp39ps" data-col-id="k2gt5etndq" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="net6rvnou1" data-row-id="hlgvikp39ps" data-col-id="k2gt5etndq" data-rowspan="1" data-colspan="1" contenteditable="true"><p><br></p></div></td><td class="ql-table-cell" data-table-id="net6rvnou1" data-row-id="hlgvikp39ps" data-col-id="9w3nt695har" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="net6rvnou1" data-row-id="hlgvikp39ps" data-col-id="9w3nt695har" data-rowspan="1" data-colspan="1" contenteditable="true"><p><br></p></div></td><td class="ql-table-cell" data-table-id="net6rvnou1" data-row-id="hlgvikp39ps" data-col-id="p6yitoe294" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="net6rvnou1" data-row-id="hlgvikp39ps" data-col-id="p6yitoe294" data-rowspan="1" data-colspan="1" contenteditable="true"><p><br></p></div></td></tr></tbody></table></div>`,
      }),
    );
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" style="margin-right: auto; width: 633px;">
            ${createTaleColHTML(3, { full: false, width: 211 })}
            <tbody>
              <tr>
                <td rowspan="1" colspan="1" style="border-color: transparent;">
                  <div data-style="border-color: transparent;">
                    <p><br></p>
                  </div>
                </td>
                <td rowspan="1" colspan="1" style="border-bottom-color: transparent;">
                  <div data-style="border-bottom-color: transparent;">
                    <p><br></p>
                  </div>
                </td>
                <td rowspan="1" colspan="1">
                  <div>
                    <p><br></p>
                  </div>
                </td>
              </tr>
              </tr>
                <td rowspan="1" colspan="1" style="border-right-color: transparent;">
                  <div data-style="border-right-color: transparent;">
                    <p><br></p>
                  </div>
                </td>
                <td rowspan="1" colspan="1" style="border-color: transparent;">
                  <div data-style="border-color: transparent;">
                    <p><br></p>
                  </div>
                </td>
                <td rowspan="1" colspan="1">
                  <div>
                    <p><br></p>
                  </div>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1">
                  <div>
                    <p><br></p>
                  </div>
                </td>
                <td rowspan="1" colspan="1">
                  <div>
                    <p><br></p>
                  </div>
                </td>
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
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });

  it('clipboard convert cell background', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(
      quill.clipboard.convert({
        html: `<table class="ql-table" data-table-id="09vk8hiocha7" cellpadding="0" cellspacing="0" style="margin-right: auto; width: 633px;"><colgroup data-table-id="09vk8hiocha7" contenteditable="false"><col width="211px" data-table-id="09vk8hiocha7" data-col-id="srfl2yk2jg"><col width="211px" data-table-id="09vk8hiocha7" data-col-id="d65st33j925"><col width="211px" data-table-id="09vk8hiocha7" data-col-id="4ab6o7bnh4w"></colgroup><tbody data-table-id="09vk8hiocha7"><tr class="ql-table-row" data-table-id="09vk8hiocha7" data-row-id="cupiz2pct7b"><td class="ql-table-cell" data-table-id="09vk8hiocha7" data-row-id="cupiz2pct7b" data-col-id="srfl2yk2jg" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="09vk8hiocha7" data-row-id="cupiz2pct7b" data-col-id="srfl2yk2jg" data-rowspan="1" data-colspan="1" contenteditable="true"><p><br></p></div></td><td class="ql-table-cell" data-table-id="09vk8hiocha7" data-row-id="cupiz2pct7b" data-col-id="d65st33j925" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="09vk8hiocha7" data-row-id="cupiz2pct7b" data-col-id="d65st33j925" data-rowspan="1" data-colspan="1" contenteditable="true"><p><br></p></div></td><td class="ql-table-cell" data-table-id="09vk8hiocha7" data-row-id="cupiz2pct7b" data-col-id="4ab6o7bnh4w" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="09vk8hiocha7" data-row-id="cupiz2pct7b" data-col-id="4ab6o7bnh4w" data-rowspan="1" data-colspan="1" contenteditable="true"><p><br></p></div></td></tr><tr class="ql-table-row" data-table-id="09vk8hiocha7" data-row-id="on34v2us4vp"><td class="ql-table-cell" data-table-id="09vk8hiocha7" data-row-id="on34v2us4vp" data-col-id="srfl2yk2jg" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="09vk8hiocha7" data-row-id="on34v2us4vp" data-col-id="srfl2yk2jg" data-rowspan="1" data-colspan="1" contenteditable="true"><p><br></p></div></td><td class="ql-table-cell" data-table-id="09vk8hiocha7" data-row-id="on34v2us4vp" data-col-id="d65st33j925" rowspan="1" colspan="1" style="background-color: transparent;"><div class="ql-table-cell-inner table-up-selection--selected" data-table-id="09vk8hiocha7" data-row-id="on34v2us4vp" data-col-id="d65st33j925" data-rowspan="1" data-colspan="1" contenteditable="true" data-style="background-color: transparent;"><p><br></p></div></td><td class="ql-table-cell" data-table-id="09vk8hiocha7" data-row-id="on34v2us4vp" data-col-id="4ab6o7bnh4w" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="09vk8hiocha7" data-row-id="on34v2us4vp" data-col-id="4ab6o7bnh4w" data-rowspan="1" data-colspan="1" contenteditable="true"><p><br></p></div></td></tr><tr class="ql-table-row" data-table-id="09vk8hiocha7" data-row-id="rjpd1nu9ug"><td class="ql-table-cell" data-table-id="09vk8hiocha7" data-row-id="rjpd1nu9ug" data-col-id="srfl2yk2jg" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="09vk8hiocha7" data-row-id="rjpd1nu9ug" data-col-id="srfl2yk2jg" data-rowspan="1" data-colspan="1" contenteditable="true"><p><br></p></div></td><td class="ql-table-cell" data-table-id="09vk8hiocha7" data-row-id="rjpd1nu9ug" data-col-id="d65st33j925" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="09vk8hiocha7" data-row-id="rjpd1nu9ug" data-col-id="d65st33j925" data-rowspan="1" data-colspan="1" contenteditable="true"><p><br></p></div></td><td class="ql-table-cell" data-table-id="09vk8hiocha7" data-row-id="rjpd1nu9ug" data-col-id="4ab6o7bnh4w" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="09vk8hiocha7" data-row-id="rjpd1nu9ug" data-col-id="4ab6o7bnh4w" data-rowspan="1" data-colspan="1" contenteditable="true"><p><br></p></div></td></tr></tbody></table>`,
      }),
    );
    await vi.runAllTimersAsync();

    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" style="margin-right: auto; width: 633px;">
            ${createTaleColHTML(3, { full: false, width: 211 })}
            <tbody>
              <tr>
                <td rowspan="1" colspan="1">
                  <div>
                    <p><br></p>
                  </div>
                </td>
                <td rowspan="1" colspan="1">
                  <div>
                    <p><br></p>
                  </div>
                </td>
                <td rowspan="1" colspan="1">
                  <div>
                    <p><br></p>
                  </div>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1">
                  <div>
                    <p><br></p>
                  </div>
                </td>
                <td rowspan="1" colspan="1" style="background-color: transparent;">
                  <div data-style="background-color: transparent;">
                    <p><br></p>
                  </div>
                </td>
                <td rowspan="1" colspan="1">
                  <div>
                    <p><br></p>
                  </div>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1">
                  <div>
                    <p><br></p>
                  </div>
                </td>
                <td rowspan="1" colspan="1">
                  <div>
                    <p><br></p>
                  </div>
                </td>
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
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });

  it('clipboard convert cell height', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(
      quill.clipboard.convert({
        html: `<div class="ql-table-wrapper" data-table-id="nihaf83179p" contenteditable="false"><table class="ql-table" data-table-id="nihaf83179p" cellpadding="0" cellspacing="0" style="margin-right: auto; width: 634px;"><colgroup data-table-id="nihaf83179p" contenteditable="false"><col width="317px" data-table-id="nihaf83179p" data-col-id="d9nfgefj3q"><col width="317px" data-table-id="nihaf83179p" data-col-id="k1cx4gfr7qs"></colgroup><tbody data-table-id="nihaf83179p"><tr class="ql-table-row" data-table-id="nihaf83179p" data-row-id="nqmnbvuykce"><td class="ql-table-cell" data-table-id="nihaf83179p" data-row-id="nqmnbvuykce" data-col-id="d9nfgefj3q" rowspan="1" colspan="1" style="height: 73px;"><div class="ql-table-cell-inner" data-table-id="nihaf83179p" data-row-id="nqmnbvuykce" data-col-id="d9nfgefj3q" data-rowspan="1" data-colspan="1" contenteditable="true" data-style="height: 73px;"><p><br></p></div></td><td class="ql-table-cell" data-table-id="nihaf83179p" data-row-id="nqmnbvuykce" data-col-id="k1cx4gfr7qs" rowspan="1" colspan="1" style="height: 73px;"><div class="ql-table-cell-inner" data-table-id="nihaf83179p" data-row-id="nqmnbvuykce" data-col-id="k1cx4gfr7qs" data-rowspan="1" data-colspan="1" contenteditable="true" data-style="height: 73px;"><p><br></p></div></td></tr><tr class="ql-table-row" data-table-id="nihaf83179p" data-row-id="hlimp9vxfh"><td class="ql-table-cell" data-table-id="nihaf83179p" data-row-id="hlimp9vxfh" data-col-id="d9nfgefj3q" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="nihaf83179p" data-row-id="hlimp9vxfh" data-col-id="d9nfgefj3q" data-rowspan="1" data-colspan="1" contenteditable="true"><p><br></p></div></td><td class="ql-table-cell" data-table-id="nihaf83179p" data-row-id="hlimp9vxfh" data-col-id="k1cx4gfr7qs" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="nihaf83179p" data-row-id="hlimp9vxfh" data-col-id="k1cx4gfr7qs" data-rowspan="1" data-colspan="1" contenteditable="true"><p><br></p></div></td></tr></tbody></table></div>`,
      }),
    );
    await vi.runAllTimersAsync();

    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" style="margin-right: auto; width: 634px;">
            ${createTaleColHTML(2, { full: false, width: 317 })}
            <tbody>
              <tr>
                <td rowspan="1" colspan="1" style="height: 73px;">
                  <div data-style="height: 73px;">
                    <p><br></p>
                  </div>
                </td>
                <td rowspan="1" colspan="1" style="height: 73px;">
                  <div data-style="height: 73px;">
                    <p><br></p>
                  </div>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1">
                  <div>
                    <p><br></p>
                  </div>
                </td>
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
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });

  it('clipboard convert empty cell should not ignore', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, { full: false });
    quill.setContents(
      quill.clipboard.convert({
        html: `<table><tbody><tr><th>q</th><th>w</th><th>e</th></tr><tr><th></th><td>2</td><td>3</td></tr><tr><th></th><td>4</td><td>5</td></tr></tbody></table>`,
      }),
    );
    await vi.runAllTimersAsync();

    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" style="margin-right: auto; width: 300px;">
            ${createTaleColHTML(3, { full: false, width: 100 })}
            <tbody>
              <tr>
                <th rowspan="1" colspan="1">
                  <div ${datasetTag('th')}>
                    <p>q</p>
                  </div>
                </th>
                <th rowspan="1" colspan="1">
                  <div ${datasetTag('th')}>
                    <p>w</p>
                  </div>
                </th>
                <th rowspan="1" colspan="1">
                  <div ${datasetTag('th')}>
                    <p>e</p>
                  </div>
                </th>
              </tr>
              <tr>
                <th rowspan="1" colspan="1">
                  <div ${datasetTag('th')}>
                    <p><br></p>
                  </div>
                </th>
                <td rowspan="1" colspan="1">
                  <div ${datasetTag('td')}>
                    <p>2</p>
                  </div>
                </td>
                <td rowspan="1" colspan="1">
                  <div ${datasetTag('td')}>
                    <p>3</p>
                  </div>
                </td>
              </tr>
              <tr>
                <th rowspan="1" colspan="1">
                  <div ${datasetTag('th')}>
                    <p><br></p>
                  </div>
                </th>
                <td rowspan="1" colspan="1">
                  <div ${datasetTag('td')}>
                    <p>4</p>
                  </div>
                </td>
                <td rowspan="1" colspan="1">
                  <div ${datasetTag('td')}>
                    <p>5</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'class', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });

  it('clipboard convert cell background with default background', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(
      quill.clipboard.convert({
        html: `<table class="ql-table" data-table-id="blb417t011v" cellpadding="0" cellspacing="0" style="margin-right: auto; width: 242px;"><colgroup data-table-id="blb417t011v" contenteditable="false"><col width="121px" data-table-id="blb417t011v" data-col-id="o9gj05324t"><col width="121px" data-table-id="blb417t011v" data-col-id="fhyoaxplvom"></colgroup><tbody data-table-id="blb417t011v"><tr class="ql-table-row" data-table-id="blb417t011v" data-row-id="ryohl03jd9"><td class="ql-table-cell" data-table-id="blb417t011v" data-row-id="ryohl03jd9" data-col-id="o9gj05324t" rowspan="1" colspan="1" style="background-color: rgb(41, 114, 244);"><div class="ql-table-cell-inner" data-table-id="blb417t011v" data-row-id="ryohl03jd9" data-col-id="o9gj05324t" data-rowspan="1" data-colspan="1" data-style="background-color:rgb(41, 114, 244)" contenteditable="true"><p> <span style="background-color: rgb(230, 0, 0);">123</span>456<span style="background-color: rgb(0, 138, 0);">789</span></p><h1>h<span style="background-color: rgb(0, 0, 0);">ea</span>d</h1></div></td><td class="ql-table-cell" data-table-id="blb417t011v" data-row-id="ryohl03jd9" data-col-id="fhyoaxplvom" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="blb417t011v" data-row-id="ryohl03jd9" data-col-id="fhyoaxplvom" data-rowspan="1" data-colspan="1" contenteditable="true"><p>2</p></div></td></tr></tbody></table>`,
      }),
    );
    await vi.runAllTimersAsync();

    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" style="margin-right: auto; width: 242px;">
            ${createTaleColHTML(2, { full: false, width: 121 })}
            <tbody>
              <tr>
                <td colspan="1" rowspan="1" style="background-color: rgb(41, 114, 244);">
                  <div data-style="background-color: rgb(41, 114, 244);">
                    <p><span style="background-color: rgb(230, 0, 0);">123</span>456<span style="background-color: rgb(0, 138, 0);">789</span></p>
                    <h1>h<span style="background-color: rgb(0, 0, 0);">ea</span>d</h1>
                  </div>
                </td>
                <td colspan="1" rowspan="1">
                  <div>
                    <p>2</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
    expectDelta(
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { full: false, width: 121 } } },
        { insert: { 'table-up-col': { full: false, width: 121 } } },
        { attributes: { background: '#e60000' }, insert: '123' },
        { insert: '456' },
        { attributes: { background: '#008a00' }, insert: '789' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1, style: 'background-color: rgb(41, 114, 244);' } }, insert: '\n' },
        { insert: 'h' },
        { attributes: { background: '#000000' }, insert: 'ea' },
        { insert: 'd' },
        { attributes: { 'header': 1, 'table-up-cell-inner': { rowspan: 1, colspan: 1, style: 'background-color: rgb(41, 114, 244);' } }, insert: '\n' },
        { insert: '2' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '\n' },
      ]),
      quill.getContents(),
    );
  });

  it('clipboard convert cell background if text background equal cell background then clean text background', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(
      quill.clipboard.convert({
        html: `<table class="ql-table" data-table-id="7lkdloid2pb" cellpadding="0" cellspacing="0" style="margin-right: auto; width: 100px;"><colgroup data-table-id="7lkdloid2pb" contenteditable="false"><col width="100px" data-table-id="7lkdloid2pb" data-col-id="r6f08i7n39"></colgroup><tbody data-table-id="7lkdloid2pb"><tr class="ql-table-row" data-table-id="7lkdloid2pb" data-row-id="xb2pjkx1fkb"><td class="ql-table-cell" data-table-id="7lkdloid2pb" data-row-id="xb2pjkx1fkb" data-col-id="r6f08i7n39" rowspan="1" colspan="1" style="background-color: rgb(0, 102, 204);"><div class="ql-table-cell-inner" data-table-id="7lkdloid2pb" data-row-id="xb2pjkx1fkb" data-col-id="r6f08i7n39" data-rowspan="1" data-colspan="1" contenteditable="true" data-style="background-color: rgb(0, 102, 204);"><p><span style="background-color: rgb(0, 102, 204);">123</span></p></div></td></tr></tbody></table>`,
      }),
    );
    await vi.runAllTimersAsync();

    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" style="margin-right: auto; width: 100px;">
            ${createTaleColHTML(1, { full: false, width: 100 })}
            <tbody>
              <tr>
                <td colspan="1" rowspan="1" style="background-color: rgb(0, 102, 204);">
                  <div data-style="background-color: rgb(0, 102, 204);">
                    <p>123</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });

  it('convert background on table/tbody/tr/td', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, { full: false });
    quill.setContents(
      quill.clipboard.convert({
        html: `
          <table style="background-color: red">
            <tbody>
              <tr style="background-color: yellow">
                <td style="background-color: aqua">1</td>
                <td>2</td>
              </tr>
              <tr>
                <td>3</td>
                <td>4</td>
              </tr>
            </tbody><tfoot style="background-color: blue">
              <tr>
                <td>5</td>
                <td>6</td>
              </tr>
            </tfoot>
          </table>
        `,
      }),
    );
    await vi.runAllTimersAsync();

    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" style="margin-right: auto; width: 200px;">
            ${createTaleColHTML(2, { full: false, width: 100 })}
            <tbody>
              <tr>
                <td colspan="1" rowspan="1" style="background-color: aqua;">
                  <div data-style="background-color: aqua;">
                    <p><span style="background-color: aqua;">1</span></p>
                  </div>
                </td>
                <td colspan="1" rowspan="1" style="background-color: yellow;">
                  <div data-style="background-color: yellow;">
                    <p><span style="background-color: yellow;">2</span></p>
                  </div>
                </td>
              </tr>
              <tr>
                <td colspan="1" rowspan="1" style="background-color: red;">
                  <div data-style="background-color: red;">
                    <p><span style="background-color: red;">3</span></p>
                  </div>
                </td>
                <td colspan="1" rowspan="1" style="background-color: red;">
                  <div data-style="background-color: red;">
                    <p><span style="background-color: red;">4</span></p>
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="1" rowspan="1" style="background-color: blue;">
                  <div data-style="background-color: blue;">
                    <p><span style="background-color: blue;">5</span></p>
                  </div>
                </td>
                <td colspan="1" rowspan="1" style="background-color: blue;">
                  <div data-style="background-color: blue;">
                    <p><span style="background-color: blue;">6</span></p>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });

  it('clipboard convert should generate colgroup at correct position', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, { full: false });
    quill.setContents(
      quill.clipboard.convert({
        html: '<table class="ql-table" data-table-id="0u473v7j5th" cellpadding="0" cellspacing="0"><tbody data-table-id="0u473v7j5th"><tr class="ql-table-row" data-table-id="0u473v7j5th" data-row-id="1de78ie70hj"><td class="ql-table-cell" data-table-id="0u473v7j5th" data-row-id="1de78ie70hj" data-col-id="0025lmzkmn85x" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="0u473v7j5th" data-row-id="1de78ie70hj" data-col-id="0025lmzkmn85x" data-rowspan="1" data-colspan="1" contenteditable="true"><p>1</p></div></td><td class="ql-table-cell" data-table-id="0u473v7j5th" data-row-id="1de78ie70hj" data-col-id="g8v4waukxpe" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="0u473v7j5th" data-row-id="1de78ie70hj" data-col-id="g8v4waukxpe" data-rowspan="1" data-colspan="1" contenteditable="true"><p>2</p></div></td><td class="ql-table-cell" data-table-id="0u473v7j5th" data-row-id="1de78ie70hj" data-col-id="7ubw564uue5" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="0u473v7j5th" data-row-id="1de78ie70hj" data-col-id="7ubw564uue5" data-rowspan="1" data-colspan="1" contenteditable="true"><p>3</p></div></td></tr></tbody><caption class="ql-table-caption" data-table-id="0u473v7j5th" contenteditable="true">title</caption></table>',
      }),
    );
    await vi.runAllTimersAsync();

    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" style="margin-right: auto; width: 300px;">
            ${createTableCaptionHTML({ text: 'title' })}
            ${createTaleColHTML(3, { full: false, width: 100 })}
            ${createTableBodyHTML(1, 3, { isEmpty: false })}
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
    expectDelta(
      new Delta([
        { insert: '\ntitle' },
        { attributes: { 'table-up-caption': { side: 'top' } }, insert: '\n' },
        { insert: { 'table-up-col': { full: false, width: 100 } } },
        { insert: { 'table-up-col': { full: false, width: 100 } } },
        { insert: { 'table-up-col': { full: false, width: 100 } } },
        { insert: '1' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { insert: '2' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { insert: '3' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { insert: '\n' },
      ]),
      quill.getContents(),
    );
  });

  it('clipboard convert rowspan and struct have empty tr', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(
      quill.clipboard.convert({
        html: `
          <body link=blue vlink=purple>

          <table border=0 cellpadding=0 cellspacing=0 width=126 style='border-collapse:
          collapse;width:94pt'>
          <!--StartFragment-->
          <col width=63 span=2 style='width:47pt'>
          <tr height=19 style='height:14.4pt'>
            <td rowspan=6 height=114 class=xl65 width=63 style='border-bottom:.5pt solid black;
            height:86.4pt;width:47pt'>合并1</td>
            <td rowspan=2 class=xl65 width=63 style='border-bottom:.5pt solid black;
            width:47pt'>合并2</td>
          </tr>
          <tr height=19 style='height:14.4pt'>
          </tr>
          <tr height=19 style='height:14.4pt'>
            <td rowspan=2 height=38 class=xl65 style='border-bottom:.5pt solid black;
            height:28.8pt;border-top:none'>合并3</td>
          </tr>
          <tr height=19 style='height:14.4pt'>
          </tr>
          <tr height=19 style='height:14.4pt'>
            <td rowspan=2 height=38 class=xl65 style='border-bottom:.5pt solid black;
            height:28.8pt;border-top:none'>合并4</td>
          </tr>
          <tr height=19 style='height:14.4pt'>
          </tr>
          <!--EndFragment-->
          </table>

          </body>
        `,
      }),
    );
    await vi.runAllTimersAsync();

    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0">
            ${createTaleColHTML(2, { full: false, width: 63 })}
            <tbody>
              <tr>
                <td rowspan="3" colspan="1">
                  <div><p>合并1</p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div><p>合并2</p></div>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1">
                  <div><p>合并3</p></div>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1">
                  <div><p>合并4</p></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'data-style', 'style', 'contenteditable'] },
    );
    expectDelta(
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { full: false, width: 63 } } },
        { insert: { 'table-up-col': { full: false, width: 63 } } },
        { insert: '合并1' },
        { attributes: { 'table-up-cell-inner': { rowspan: 3, colspan: 1 } }, insert: '\n' },
        { insert: '合并2' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '合并3' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '合并4' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '\n' },
      ]),
      quill.getContents(),
    );
  });

  it('clipboard convert empty multiple tr to `emptyRow`', async () => {
    const quill = createQuillWithTableModule('<p><br></p>', { autoMergeCell: false, full: false });
    quill.setContents(
      quill.clipboard.convert({
        html: `<table><tbody><tr><td rowspan="3" colspan="3">1</td></tr><tr></tr><tr></tr><tr><td>2</td><td>3</td><td>4</td></tr></tbody></table>`,
      }),
    );
    await vi.runAllTimersAsync();

    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0">
            ${createTaleColHTML(3, { full: false, width: 100 })}
            <tbody>
              <tr>
                <td rowspan="3" colspan="3" data-empty-row="length:2">
                  <div data-empty-row="length:2"><p>1</p></div>
                </td>
              </tr>
              <tr>
              </tr>
              <tr>
              </tr>
              <tr>
                <td rowspan="1" colspan="1">
                  <div><p>2</p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div><p>3</p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div><p>4</p></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      {
        ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'data-style', 'style', 'contenteditable'],
        replaceAttrs: {
          'data-empty-row': replaceAttrEmptyRow,
        },
      },
    );
  });

  it('clipboard convert `emptyRow` cell', async () => {
    const quill = createQuillWithTableModule('<p><br></p>', { autoMergeCell: false });
    quill.setContents(
      quill.clipboard.convert({
        html: `<div class="ql-table-wrapper" data-table-id="4rxokyjlh63" contenteditable="false"><table class="ql-table" data-table-id="4rxokyjlh63" cellpadding="0" cellspacing="0" style="margin-right: auto; width: 300px;"><colgroup data-table-id="4rxokyjlh63" contenteditable="false"><col width="100px" data-table-id="4rxokyjlh63" data-col-id="y5a4z42ufdr"><col width="100px" data-table-id="4rxokyjlh63" data-col-id="ukr081pgksl"><col width="100px" data-table-id="4rxokyjlh63" data-col-id="0kg1x92lxzv"></colgroup><tbody data-table-id="4rxokyjlh63"><tr class="ql-table-row" data-table-id="4rxokyjlh63" data-row-id="uezdr0no6w8" data-wrap-tag="tbody"><td class="ql-table-cell" data-table-id="4rxokyjlh63" data-row-id="uezdr0no6w8" data-col-id="y5a4z42ufdr" data-wrap-tag="tbody" rowspan="3" colspan="3" data-empty-row="[&quot;xghllrjrcar&quot;,&quot;j2cc6owtd9l&quot;]"><div class="ql-table-cell-inner" data-table-id="4rxokyjlh63" data-row-id="uezdr0no6w8" data-col-id="y5a4z42ufdr" data-rowspan="3" data-colspan="3" data-tag="td" data-wrap-tag="tbody" data-empty-row="[&quot;xghllrjrcar&quot;,&quot;j2cc6owtd9l&quot;]" contenteditable="true"><p><span>1</span></p></div></td></tr><tr class="ql-table-row" data-table-id="4rxokyjlh63" data-row-id="j2cc6owtd9l" data-wrap-tag="tbody"></tr><tr class="ql-table-row" data-table-id="4rxokyjlh63" data-row-id="xghllrjrcar" data-wrap-tag="tbody"></tr><tr class="ql-table-row" data-table-id="4rxokyjlh63" data-row-id="afwfmtyccci" data-wrap-tag="tbody"><td class="ql-table-cell" data-table-id="4rxokyjlh63" data-row-id="afwfmtyccci" data-col-id="y5a4z42ufdr" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="4rxokyjlh63" data-row-id="afwfmtyccci" data-col-id="y5a4z42ufdr" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody" contenteditable="true"><p><span>2</span></p></div></td><td class="ql-table-cell" data-table-id="4rxokyjlh63" data-row-id="afwfmtyccci" data-col-id="ukr081pgksl" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="4rxokyjlh63" data-row-id="afwfmtyccci" data-col-id="ukr081pgksl" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody" contenteditable="true"><p><span>3</span></p></div></td><td class="ql-table-cell" data-table-id="4rxokyjlh63" data-row-id="afwfmtyccci" data-col-id="0kg1x92lxzv" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="4rxokyjlh63" data-row-id="afwfmtyccci" data-col-id="0kg1x92lxzv" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody" contenteditable="true"><p><span>4</span></p></div></td></tr></tbody></table></div>`,
      }),
    );
    await vi.runAllTimersAsync();

    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0">
            ${createTaleColHTML(3, { full: false, width: 100 })}
            <tbody>
              <tr>
                <td rowspan="3" colspan="3" data-empty-row="length:2">
                  <div data-empty-row="length:2"><p>1</p></div>
                </td>
              </tr>
              <tr>
              </tr>
              <tr>
              </tr>
              <tr>
                <td rowspan="1" colspan="1">
                  <div><p>2</p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div><p>3</p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div><p>4</p></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      {
        ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'data-style', 'style', 'contenteditable'],
        replaceAttrs: {
          'data-empty-row': replaceAttrEmptyRow,
        },
      },
    );
  });

  it('clipboard convert continuous `emptyRow`', async () => {
    const quill = createQuillWithTableModule('<p><br></p>', { autoMergeCell: false });
    quill.setContents(
      quill.clipboard.convert({
        html: `<div class="ql-table-wrapper" data-table-id="c0o77jksufl" contenteditable="false"><table class="ql-table" data-table-id="c0o77jksufl" cellpadding="0" cellspacing="0" style="margin-right: auto; width: 300px;"><colgroup data-table-id="c0o77jksufl" contenteditable="false"><col width="100px" data-table-id="c0o77jksufl" data-col-id="a49uy7ts9x"><col width="100px" data-table-id="c0o77jksufl" data-col-id="9rvrf9ve5dp"><col width="100px" data-table-id="c0o77jksufl" data-col-id="vi4hyjmdii"></colgroup><tbody data-table-id="c0o77jksufl"><tr class="ql-table-row" data-table-id="c0o77jksufl" data-row-id="0oi5ud6p8jne" data-wrap-tag="tbody"><td class="ql-table-cell" data-table-id="c0o77jksufl" data-row-id="0oi5ud6p8jne" data-col-id="a49uy7ts9x" data-wrap-tag="tbody" rowspan="3" colspan="3" data-empty-row="[&quot;xdpparkt6l&quot;,&quot;ghbvv1sg1pu&quot;]"><div class="ql-table-cell-inner" data-table-id="c0o77jksufl" data-row-id="0oi5ud6p8jne" data-col-id="a49uy7ts9x" data-rowspan="3" data-colspan="3" data-tag="td" data-wrap-tag="tbody" data-empty-row="[&quot;xdpparkt6l&quot;,&quot;ghbvv1sg1pu&quot;]" contenteditable="true"><p><span>1</span></p></div></td></tr><tr class="ql-table-row" data-table-id="c0o77jksufl" data-row-id="ghbvv1sg1pu" data-wrap-tag="tbody"></tr><tr class="ql-table-row" data-table-id="c0o77jksufl" data-row-id="xdpparkt6l" data-wrap-tag="tbody"></tr><tr class="ql-table-row" data-table-id="c0o77jksufl" data-row-id="3mnrj0uu4rh" data-wrap-tag="tbody"><td class="ql-table-cell" data-table-id="c0o77jksufl" data-row-id="3mnrj0uu4rh" data-col-id="a49uy7ts9x" data-wrap-tag="tbody" rowspan="3" colspan="3" data-empty-row="[&quot;7au43sfdyh2&quot;,&quot;a2u11wlu63&quot;]"><div class="ql-table-cell-inner" data-table-id="c0o77jksufl" data-row-id="3mnrj0uu4rh" data-col-id="a49uy7ts9x" data-rowspan="3" data-colspan="3" data-tag="td" data-wrap-tag="tbody" data-empty-row="[&quot;7au43sfdyh2&quot;,&quot;a2u11wlu63&quot;]" contenteditable="true"><p><span>1</span></p></div></td></tr><tr class="ql-table-row" data-table-id="c0o77jksufl" data-row-id="a2u11wlu63" data-wrap-tag="tbody"></tr><tr class="ql-table-row" data-table-id="c0o77jksufl" data-row-id="7au43sfdyh2" data-wrap-tag="tbody"></tr><tr class="ql-table-row" data-table-id="c0o77jksufl" data-row-id="qhrdlqjpdeq" data-wrap-tag="tbody"><td class="ql-table-cell" data-table-id="c0o77jksufl" data-row-id="qhrdlqjpdeq" data-col-id="a49uy7ts9x" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="c0o77jksufl" data-row-id="qhrdlqjpdeq" data-col-id="a49uy7ts9x" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody" contenteditable="true"><p><span>2</span></p></div></td><td class="ql-table-cell" data-table-id="c0o77jksufl" data-row-id="qhrdlqjpdeq" data-col-id="9rvrf9ve5dp" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="c0o77jksufl" data-row-id="qhrdlqjpdeq" data-col-id="9rvrf9ve5dp" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody" contenteditable="true"><p><span>3</span></p></div></td><td class="ql-table-cell" data-table-id="c0o77jksufl" data-row-id="qhrdlqjpdeq" data-col-id="vi4hyjmdii" data-wrap-tag="tbody" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="c0o77jksufl" data-row-id="qhrdlqjpdeq" data-col-id="vi4hyjmdii" data-rowspan="1" data-colspan="1" data-tag="td" data-wrap-tag="tbody" contenteditable="true"><p><span>4</span></p></div></td></tr></tbody></table></div>`,
      }),
    );
    await vi.runAllTimersAsync();

    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0">
            ${createTaleColHTML(3, { full: false, width: 100 })}
            <tbody>
              <tr>
                <td rowspan="3" colspan="3" data-empty-row="length:2">
                  <div data-empty-row="length:2"><p>1</p></div>
                </td>
              </tr>
              <tr>
              </tr>
              <tr>
              </tr>
              <tr>
                <td rowspan="3" colspan="3" data-empty-row="length:2">
                  <div data-empty-row="length:2"><p>1</p></div>
                </td>
              </tr>
              <tr>
              </tr>
              <tr>
              </tr>
              <tr>
                <td rowspan="1" colspan="1">
                  <div><p>2</p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div><p>3</p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div><p>4</p></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      {
        ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'data-style', 'style', 'contenteditable'],
        replaceAttrs: {
          'data-empty-row': replaceAttrEmptyRow,
        },
      },
    );
  });

  it('clipboard convert empty tr to `emptyRow` in thead', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, { autoMergeCell: false, full: false });
    quill.setContents(
      quill.clipboard.convert({
        html: `<table><thead><tr><td rowspan="2" colspan="2">1</td></tr><tr></tr></thead><tbody><tr><td>1</td><td>2</td></tr><tr><td>1</td><td>2</td></tr></tbody></table>`,
      }),
    );
    await vi.runAllTimersAsync();

    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0">
            ${createTaleColHTML(2, { full: false, width: 100 })}
            <thead>
              <tr>
                <td rowspan="2" colspan="2" data-empty-row="length:1">
                  <div data-empty-row="length:1"><p>1</p></div>
                </td>
              </tr>
              <tr>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td rowspan="1" colspan="1">
                  <div><p>1</p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div><p>2</p></div>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1">
                  <div><p>1</p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div><p>2</p></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      {
        ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'data-style', 'style', 'contenteditable'],
        replaceAttrs: {
          'data-empty-row': replaceAttrEmptyRow,
        },
      },
    );
    expectDelta(
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { full: false, width: 100 } } },
        { insert: { 'table-up-col': { full: false, width: 100 } } },
        { insert: '1' },
        { attributes: { 'table-up-cell-inner': { rowspan: 2, colspan: 2, wrapTag: 'thead' } }, insert: '\n' },
        { insert: '1' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1, wrapTag: 'tbody' } }, insert: '\n' },
        { insert: '2' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1, wrapTag: 'tbody' } }, insert: '\n' },
        { insert: '1' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1, wrapTag: 'tbody' } }, insert: '\n' },
        { insert: '2' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1, wrapTag: 'tbody' } }, insert: '\n' },
        { insert: '\n' },
      ]),
      quill.getContents(),
    );
  });

  it('clipboard convert th correctly', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, { full: false });
    quill.setContents(
      quill.clipboard.convert({
        html: `
          <table class="ws-table-all" id="customers">
            <tbody>
              <tr>
                <th>Company</th>
                <th>Contact</th>
                <th>Country</th>
              </tr>
              <tr>
                <td>Alfreds Futterkiste</td>
                <td>Maria Anders</td>
                <td>Germany</td>
              </tr>
              <tr>
                <td>Centro comercial Moctezuma</td>
                <td>Francisco Chang</td>
                <td>Mexico</td>
              </tr>
            </tbody>
          </table>
        `,
      }),
    );
    await vi.runAllTimersAsync();

    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" style="margin-right: auto; width: 300px;">
            ${createTaleColHTML(3, { full: false, width: 100 })}
            <tbody>
              <tr>
                <th colspan="1" rowspan="1">
                  <div ${datasetTag('th')}>
                    <p>Company</p>
                  </div>
                </th>
                <th colspan="1" rowspan="1">
                  <div ${datasetTag('th')}>
                    <p>Contact</p>
                  </div>
                </th>
                <th colspan="1" rowspan="1">
                  <div ${datasetTag('th')}>
                    <p>Country</p>
                  </div>
                </th>
              </tr>
              <tr>
                <td colspan="1" rowspan="1">
                  <div ${datasetTag('td')}>
                    <p>Alfreds Futterkiste</p>
                  </div>
                </td>
                <td colspan="1" rowspan="1">
                  <div ${datasetTag('td')}>
                    <p>Maria Anders</p>
                  </div>
                </td>
                <td colspan="1" rowspan="1">
                  <div ${datasetTag('td')}>
                    <p>Germany</p>
                  </div>
                </td>
              </tr>
              <tr>
                <td colspan="1" rowspan="1">
                  <div ${datasetTag('td')}>
                    <p>Centro comercial Moctezuma</p>
                  </div>
                </td>
                <td colspan="1" rowspan="1">
                  <div ${datasetTag('td')}>
                    <p>Francisco Chang</p>
                  </div>
                </td>
                <td colspan="1" rowspan="1">
                  <div ${datasetTag('td')}>
                    <p>Mexico</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'class', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });

  it('convert thead and tfoot correctly', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, { full: false });
    quill.setContents(
      quill.clipboard.convert({
        html: `
          <table>
            <thead>
              <tr>
                <th>head1</th>
                <th>head2</th>
                <th>head3</th>
              </tr>
            </thead><tbody>
              <tr>
                <td>body1</td>
                <td>body2</td>
                <td>body3</td>
              </tr>
              <tr>
                <td>body4</td>
                <td>body5</td>
                <td>body6</td>
              </tr>
            </tbody><tfoot>
              <tr>
                <td>foot1</td>
                <td>foot2</td>
                <td>foot3</td>
              </tr>
            </tfoot>
          </table>
        `,
      }),
    );
    await vi.runAllTimersAsync();

    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" style="margin-right: auto; width: 300px;">
            ${createTaleColHTML(3, { full: false, width: 100 })}
            <thead>
              <tr data-wrap-tag="thead">
                <th colspan="1" rowspan="1" data-wrap-tag="thead">
                  <div ${datasetTag('th')} data-wrap-tag="thead">
                    <p>head1</p>
                  </div>
                </th>
                <th colspan="1" rowspan="1" data-wrap-tag="thead">
                  <div ${datasetTag('th')} data-wrap-tag="thead">
                    <p>head2</p>
                  </div>
                </th>
                <th colspan="1" rowspan="1" data-wrap-tag="thead">
                  <div ${datasetTag('th')} data-wrap-tag="thead">
                    <p>head3</p>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr data-wrap-tag="tbody">
                <td colspan="1" rowspan="1" data-wrap-tag="tbody">
                  <div ${datasetTag('td')} data-wrap-tag="tbody">
                    <p>body1</p>
                  </div>
                </td>
                <td colspan="1" rowspan="1" data-wrap-tag="tbody">
                  <div ${datasetTag('td')} data-wrap-tag="tbody">
                    <p>body2</p>
                  </div>
                </td>
                <td colspan="1" rowspan="1" data-wrap-tag="tbody">
                  <div ${datasetTag('td')} data-wrap-tag="tbody">
                    <p>body3</p>
                  </div>
                </td>
              </tr>
              <tr data-wrap-tag="tbody">
                <td colspan="1" rowspan="1" data-wrap-tag="tbody">
                  <div ${datasetTag('td')} data-wrap-tag="tbody">
                    <p>body4</p>
                  </div>
                </td>
                <td colspan="1" rowspan="1" data-wrap-tag="tbody">
                  <div ${datasetTag('td')} data-wrap-tag="tbody">
                    <p>body5</p>
                  </div>
                </td>
                <td colspan="1" rowspan="1" data-wrap-tag="tbody">
                  <div ${datasetTag('td')} data-wrap-tag="tbody">
                    <p>body6</p>
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr data-wrap-tag="tfoot">
                <td colspan="1" rowspan="1" data-wrap-tag="tfoot">
                  <div ${datasetTag('td')} data-wrap-tag="tfoot">
                    <p>foot1</p>
                  </div>
                </td>
                <td colspan="1" rowspan="1" data-wrap-tag="tfoot">
                  <div ${datasetTag('td')} data-wrap-tag="tfoot">
                    <p>foot2</p>
                  </div>
                </td>
                <td colspan="1" rowspan="1" data-wrap-tag="tfoot">
                  <div ${datasetTag('td')} data-wrap-tag="tfoot">
                    <p>foot3</p>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });

  it('convert thead rowspan to tbody', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, { full: false });
    quill.setContents(
      quill.clipboard.convert({
        html: `
          <table>
            <thead>
              <tr>
                <td rowspan="2" colspan="2">123</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>2</td>
              </tr>
              <tr>
                <td>1</td>
                <td>2</td>
              </tr>
            </tbody>
          </table>
        `,
      }),
    );
    await vi.runAllTimersAsync();

    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" style="margin-right: auto; width: 200px;">
            ${createTaleColHTML(2, { full: false, width: 100 })}
            <thead>
              <tr data-wrap-tag="thead">
                <td colspan="2" rowspan="1" data-wrap-tag="thead">
                  <div ${datasetTag('td')} data-wrap-tag="thead">
                    <p>123</p>
                  </div>
                </td>
              </tr>
            </thead>
            <tbody>
              <tr data-wrap-tag="tbody">
                <td colspan="1" rowspan="1" data-wrap-tag="tbody">
                  <div ${datasetTag('td')} data-wrap-tag="tbody">
                    <p>1</p>
                  </div>
                </td>
                <td colspan="1" rowspan="1" data-wrap-tag="tbody">
                  <div ${datasetTag('td')} data-wrap-tag="tbody">
                    <p>2</p>
                  </div>
                </td>
              </tr>
              <tr data-wrap-tag="tbody">
                <td colspan="1" rowspan="1" data-wrap-tag="tbody">
                  <div ${datasetTag('td')} data-wrap-tag="tbody">
                    <p>1</p>
                  </div>
                </td>
                <td colspan="1" rowspan="1" data-wrap-tag="tbody">
                  <div ${datasetTag('td')} data-wrap-tag="tbody">
                    <p>2</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });
});

describe('clipboard column', () => {
  it('clipboard convert col with span attribute', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, { autoMergeCell: false });
    quill.setContents(
      quill.clipboard.convert({
        html: `
          <body link=blue vlink=purple>

          <table border=0 cellpadding=0 cellspacing=0 width=252 style='border-collapse:
          collapse;width:188pt'>
          <!--StartFragment-->
          <col width=63 span=4 style='width:47pt'>
          <tr height=19 style='height:14.4pt'>
            <td colspan=2 rowspan=6 height=114 class=xl65 width=126 style='height:86.4pt;
            width:94pt'>1</td>
            <td colspan=2 rowspan=2 class=xl65 width=126 style='width:94pt'>2</td>
          </tr>
          <tr height=19 style='height:14.4pt'>
          </tr>
          <tr height=19 style='height:14.4pt'>
            <td colspan=2 rowspan=2 height=38 class=xl65 style='height:28.8pt'>3</td>
          </tr>
          <tr height=19 style='height:14.4pt'>
          </tr>
          <tr height=19 style='height:14.4pt'>
            <td colspan=2 rowspan=2 height=38 class=xl65 style='height:28.8pt'>4</td>
          </tr>
          <tr height=19 style='height:14.4pt'>
          </tr>
          <!--EndFragment-->
          </table>

          </body>
        `,
      }),
    );
    await vi.runAllTimersAsync();

    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0">
            ${createTaleColHTML(4, { full: false, width: 63 })}
            <tbody>
              <tr>
                <td rowspan="6" colspan="2" data-empty-row="length:1">
                  <div data-empty-row="length:1"><p>1</p></div>
                </td>
                <td rowspan="2" colspan="2" data-empty-row="length:1">
                  <div data-empty-row="length:1"><p>2</p></div>
                </td>
              </tr>
              <tr></tr>
              <tr>
                <td rowspan="2" colspan="2" data-empty-row="length:1">
                  <div data-empty-row="length:1"><p>3</p></div>
                </td>
              </tr>
              <tr></tr>
              <tr>
                <td rowspan="2" colspan="2" data-empty-row="length:1">
                  <div data-empty-row="length:1"><p>4</p></div>
                </td>
              </tr>
              <tr></tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      {
        ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'data-style', 'style', 'contenteditable'],
        replaceAttrs: {
          'data-empty-row': replaceAttrEmptyRow,
        },
      },
    );
    expectDelta(
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { full: false, width: 63 } } },
        { insert: { 'table-up-col': { full: false, width: 63 } } },
        { insert: { 'table-up-col': { full: false, width: 63 } } },
        { insert: { 'table-up-col': { full: false, width: 63 } } },
        { insert: '1' },
        { attributes: { 'table-up-cell-inner': { rowspan: 6, colspan: 2 } }, insert: '\n' },
        { insert: '2' },
        { attributes: { 'table-up-cell-inner': { rowspan: 2, colspan: 2 } }, insert: '\n' },
        { insert: '3' },
        { attributes: { 'table-up-cell-inner': { rowspan: 2, colspan: 2 } }, insert: '\n' },
        { insert: '4' },
        { attributes: { 'table-up-cell-inner': { rowspan: 2, colspan: 2 } }, insert: '\n' },
        { insert: '\n' },
      ]),
      quill.getContents(),
    );
  });

  it('convert col width with option `full: false`', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, { full: false });
    quill.setContents(
      quill.clipboard.convert({
        html: `
          <table class="ws-table-all" id="customers">
            <tbody>
              <tr>
                <td>content</td>
                <td>content</td>
                <td>content</td>
              </tr>
            </tbody>
          </table>
        `,
      }),
    );
    await vi.runAllTimersAsync();

    expectDelta(
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { full: false, width: 100 } } },
        { insert: { 'table-up-col': { full: false, width: 100 } } },
        { insert: { 'table-up-col': { full: false, width: 100 } } },
        { insert: 'content' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: 'content' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: 'content' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '\n' },
      ]),
      quill.getContents(),
    );
  });

  it('convert col width with option `full: true`', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, { full: true });
    quill.setContents(
      quill.clipboard.convert({
        html: `
          <table class="ws-table-all" id="customers">
            <tbody>
              <tr>
                <td>content</td>
                <td>content</td>
                <td>content</td>
              </tr>
            </tbody>
          </table>
        `,
      }),
    );
    await vi.runAllTimersAsync();

    expectDelta(
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { full: true, width: 33.3333 } } },
        { insert: { 'table-up-col': { full: true, width: 33.3333 } } },
        { insert: { 'table-up-col': { full: true, width: 33.3333 } } },
        { insert: 'content' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: 'content' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: 'content' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '\n' },
      ]),
      quill.getContents(),
    );
  });

  it('convert table without colgroup should ignore td width when option `full: false`', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, { full: false });
    quill.setContents(
      quill.clipboard.convert({
        html: `
          <table class="ws-table-all" id="customers">
            <tbody>
              <tr>
                <td width="220">content</td>
                <td width="140">content</td>
                <td width="180">content</td>
              </tr>
            </tbody>
          </table>
        `,
      }),
    );
    await vi.runAllTimersAsync();

    expectDelta(
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { full: false, width: 100 } } },
        { insert: { 'table-up-col': { full: false, width: 100 } } },
        { insert: { 'table-up-col': { full: false, width: 100 } } },
        { insert: 'content' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: 'content' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: 'content' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '\n' },
      ]),
      quill.getContents(),
    );
  });

  it('convert table without colgroup should ignore td width when option `full: true`', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, { full: true });
    quill.setContents(
      quill.clipboard.convert({
        html: `
          <table class="ws-table-all" id="customers">
            <tbody>
              <tr>
                <td width="220">content</td>
                <td width="140">content</td>
                <td width="180">content</td>
              </tr>
            </tbody>
          </table>
        `,
      }),
    );
    await vi.runAllTimersAsync();

    expectDelta(
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { full: true, width: 33.3333 } } },
        { insert: { 'table-up-col': { full: true, width: 33.3333 } } },
        { insert: { 'table-up-col': { full: true, width: 33.3333 } } },
        { insert: 'content' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: 'content' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: 'content' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '\n' },
      ]),
      quill.getContents(),
    );
  });

  it('convert col percent width should be `full: true`', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, { full: false });
    quill.setContents(
      quill.clipboard.convert({
        html: `
          <table class="ws-table-all" id="customers">
            <colgroup>
              <col width="25%">
              <col width="25%">
              <col width="25%">
              <col width="25%">
            </colgroup>
            <tbody>
              <tr>
                <td>content</td>
                <td>content</td>
                <td>content</td>
                <td>content</td>
              </tr>
            </tbody>
          </table>
        `,
      }),
    );
    await vi.runAllTimersAsync();

    expectDelta(
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { full: true, width: 25 } } },
        { insert: { 'table-up-col': { full: true, width: 25 } } },
        { insert: { 'table-up-col': { full: true, width: 25 } } },
        { insert: { 'table-up-col': { full: true, width: 25 } } },
        { insert: 'content' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: 'content' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: 'content' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: 'content' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '\n' },
      ]),
      quill.getContents(),
    );
  });

  it('convert col fixed width should be `full: false`', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, { full: false });
    quill.setContents(
      quill.clipboard.convert({
        html: `
          <table class="ws-table-all" id="customers">
            <colgroup>
              <col width="120px">
              <col width="120px">
              <col width="120px">
              <col width="120px">
            </colgroup>
            <tbody>
              <tr>
                <td>content</td>
                <td>content</td>
                <td>content</td>
                <td>content</td>
              </tr>
            </tbody>
          </table>
        `,
      }),
    );
    await vi.runAllTimersAsync();

    expectDelta(
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { full: false, width: 120 } } },
        { insert: { 'table-up-col': { full: false, width: 120 } } },
        { insert: { 'table-up-col': { full: false, width: 120 } } },
        { insert: { 'table-up-col': { full: false, width: 120 } } },
        { insert: 'content' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: 'content' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: 'content' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: 'content' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '\n' },
      ]),
      quill.getContents(),
    );
  });

  it('convert mixed col width should follow option `full: false`', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, { full: false });
    quill.setContents(
      quill.clipboard.convert({
        html: `
          <table class="ws-table-all" id="customers" style="width: 500px;">
            <colgroup>
              <col width="100px">
              <col width="20%">
              <col width="30%">
              <col width="150px">
            </colgroup>
            <tbody>
              <tr>
                <td>content</td>
                <td>content</td>
                <td>content</td>
                <td>content</td>
              </tr>
            </tbody>
          </table>
        `,
      }),
    );
    await vi.runAllTimersAsync();

    expectDelta(
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { full: false, width: 100 } } },
        { insert: { 'table-up-col': { full: false, width: 100 } } },
        { insert: { 'table-up-col': { full: false, width: 150 } } },
        { insert: { 'table-up-col': { full: false, width: 150 } } },
        { insert: 'content' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: 'content' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: 'content' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: 'content' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '\n' },
      ]),
      quill.getContents(),
    );
  });

  it('convert mixed col width should follow option `full: true`', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, { full: true });
    quill.setContents(
      quill.clipboard.convert({
        html: `
          <table class="ws-table-all" id="customers" style="width: 500px;">
            <colgroup>
              <col width="100px">
              <col width="20%">
              <col width="30%">
              <col width="150px">
            </colgroup>
            <tbody>
              <tr>
                <td>content</td>
                <td>content</td>
                <td>content</td>
                <td>content</td>
              </tr>
            </tbody>
          </table>
        `,
      }),
    );
    await vi.runAllTimersAsync();

    expectDelta(
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { full: true, width: 20 } } },
        { insert: { 'table-up-col': { full: true, width: 20 } } },
        { insert: { 'table-up-col': { full: true, width: 30 } } },
        { insert: { 'table-up-col': { full: true, width: 30 } } },
        { insert: 'content' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: 'content' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: 'content' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: 'content' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '\n' },
      ]),
      quill.getContents(),
    );
  });
});

describe('clipboard content format', () => {
  it('should convert html code-block correctly', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(
      quill.clipboard.convert({ html: '<div class="ql-table-wrapper" data-table-id="1"><table data-table-id="1" class="ql-table" cellpadding="0" cellspacing="0" style="margin-right: auto; width: 363px;"><colgroup data-table-id="1" contenteditable="false"><col width="121px" data-table-id="1" data-col-id="1"><col width="121px" data-table-id="1" data-col-id="2"><col width="121px" data-table-id="1" data-col-id="3"></colgroup><tbody data-table-id="1"><tr class="ql-table-row" data-table-id="1" data-row-id="1"><td class="ql-table-cell" data-table-id="1" data-row-id="1" data-col-id="1" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="1" data-col-id="1" data-rowspan="1" data-colspan="1"><p>1</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="1" data-col-id="2" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="1" data-col-id="2" data-rowspan="1" data-colspan="1"><p>2</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="1" data-col-id="3" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="1" data-col-id="3" data-rowspan="1" data-colspan="1"><p>3</p></div></td></tr><tr class="ql-table-row" data-table-id="1" data-row-id="2"><td class="ql-table-cell" data-table-id="1" data-row-id="2" data-col-id="1" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="2" data-col-id="1" data-rowspan="1" data-colspan="1"><p>4</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="2" data-col-id="2" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="2" data-col-id="2" data-rowspan="1" data-colspan="1"><div class="ql-code-block-container" spellcheck="false"><div class="ql-code-block" data-language="plain">5</div><div class="ql-code-block" data-language="plain">5</div><div class="ql-code-block" data-language="plain">5</div></div><p>5</p><p>5</p><p>5</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="2" data-col-id="3" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="2" data-col-id="3" data-rowspan="1" data-colspan="1"><p>6</p></div></td></tr><tr class="ql-table-row" data-table-id="1" data-row-id="3"><td class="ql-table-cell" data-table-id="1" data-row-id="3" data-col-id="1" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="3" data-col-id="1" data-rowspan="1" data-colspan="1"><p>7</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="3" data-col-id="2" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="3" data-col-id="2" data-rowspan="1" data-colspan="1"><p>8</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="3" data-col-id="3" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="3" data-col-id="3" data-rowspan="1" data-colspan="1"><p>9</p></div></td></tr></tbody></table></div>' }),
    );
    await vi.runAllTimersAsync();

    expectDelta(
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { full: false, width: 121 } } },
        { insert: { 'table-up-col': { full: false, width: 121 } } },
        { insert: { 'table-up-col': { full: false, width: 121 } } },
        { insert: '1' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '2' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '3' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '4' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '5' },
        { attributes: { 'code-block': 'plain', 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '5' },
        { attributes: { 'code-block': 'plain', 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '5' },
        { attributes: { 'code-block': 'plain', 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '5' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '5' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '5' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '6' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '7' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '8' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '9' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '\n' },
      ]),
      quill.getContents(),
    );
  });

  it('should convert html header correctly', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(
      quill.clipboard.convert({ html: '<div class="ql-table-wrapper" data-table-id="rlabchug06i"><table data-table-id="rlabchug06i" class="ql-table" cellpadding="0" cellspacing="0" style="margin-right: auto; width: 1166px;"><colgroup data-table-id="rlabchug06i" contenteditable="false"><col width="583px" data-table-id="rlabchug06i" data-col-id="ss993p1sqx"><col width="583px" data-table-id="rlabchug06i" data-col-id="2ixexk4mapx"></colgroup><tbody data-table-id="rlabchug06i"><tr class="ql-table-row" data-table-id="rlabchug06i" data-row-id="fvvkgpv86zw"><td class="ql-table-cell" data-table-id="rlabchug06i" data-row-id="fvvkgpv86zw" data-col-id="ss993p1sqx" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="rlabchug06i" data-row-id="fvvkgpv86zw" data-col-id="ss993p1sqx" data-rowspan="1" data-colspan="1"><h1>header1</h1></div></td><td class="ql-table-cell" data-table-id="rlabchug06i" data-row-id="fvvkgpv86zw" data-col-id="2ixexk4mapx" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="rlabchug06i" data-row-id="fvvkgpv86zw" data-col-id="2ixexk4mapx" data-rowspan="1" data-colspan="1"><h3>header3</h3></div></td></tr></tbody></table></div>' }),
    );
    await vi.runAllTimersAsync();

    expectDelta(
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { full: false, width: 583 } } },
        { insert: { 'table-up-col': { full: false, width: 583 } } },
        { insert: 'header1' },
        { attributes: { 'header': 1, 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: 'header3' },
        { attributes: { 'header': 3, 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '\n' },
      ]),
      quill.getContents(),
    );
  });

  it('should convert html image correctly', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(
      quill.clipboard.convert({ html: '<div class="ql-table-wrapper" data-table-id="7oymehdtx0k"><table data-table-id="7oymehdtx0k" data-full="true" class="ql-table" cellpadding="0" cellspacing="0" style="margin-right: auto;"><colgroup data-table-id="7oymehdtx0k" data-full="true" contenteditable="false"><col width="100%" data-full="true" data-table-id="7oymehdtx0k" data-col-id="hr7qo4t2dus"></colgroup><tbody data-table-id="7oymehdtx0k"><tr class="ql-table-row" data-table-id="7oymehdtx0k" data-row-id="69gog08ow04"><td class="ql-table-cell" data-table-id="7oymehdtx0k" data-row-id="69gog08ow04" data-col-id="hr7qo4t2dus" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="7oymehdtx0k" data-row-id="69gog08ow04" data-col-id="hr7qo4t2dus" data-rowspan="1" data-colspan="1"><p><img src="https://upload-bbs.miyoushe.com/upload/2024/06/18/5556092/73b7bae28fded7a72d93a35d5559b24c_3979852353547906724.png"></p></div></td></tr></tbody></table></div>' }),
    );
    await vi.runAllTimersAsync();

    expectDelta(
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { full: true, width: 100 } } },
        { insert: { image: 'https://upload-bbs.miyoushe.com/upload/2024/06/18/5556092/73b7bae28fded7a72d93a35d5559b24c_3979852353547906724.png' } },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '\n' },
      ]),
      quill.getContents(),
    );
  });

  it('should convert html video correctly', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(
      quill.clipboard.convert({ html: '<div class="ql-table-wrapper" data-table-id="1"><table data-table-id="1" data-full="true" class="ql-table" cellpadding="0" cellspacing="0" style="margin-right: auto;"><colgroup data-table-id="1" data-full="true" contenteditable="false"><col width="100%" data-full="true" data-table-id="1" data-col-id="1"></colgroup><tbody data-table-id="1"><tr class="ql-table-row" data-table-id="1" data-row-id="1"><td class="ql-table-cell" data-table-id="1" data-row-id="1" data-col-id="1" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="1" data-col-id="1" data-rowspan="1" data-colspan="1"><iframe class="ql-video" frameborder="0" allowfullscreen="true" src="http://127.0.0.1:5500/docs/index.html"></iframe></div></td></tr></tbody></table></div>' }),
    );
    await vi.runAllTimersAsync();

    expectDelta(
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { full: true, width: 100 } } },
        { insert: { video: 'http://127.0.0.1:5500/docs/index.html' } },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '\n' },
      ]),
      quill.getContents(),
    );
  });

  it('should convert html list correctly', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(
      quill.clipboard.convert({ html: '<div class="ql-table-wrapper" data-table-id="ls2bw9dtr6m"><table data-table-id="ls2bw9dtr6m" class="ql-table" cellpadding="0" cellspacing="0" style="margin-right: auto; width: 1166px;"><colgroup data-table-id="ls2bw9dtr6m" contenteditable="false"><col width="583px" data-table-id="ls2bw9dtr6m" data-col-id="p3imc1n7xlo"><col width="583px" data-table-id="ls2bw9dtr6m" data-col-id="ndvtber87yq"></colgroup><tbody data-table-id="ls2bw9dtr6m"><tr class="ql-table-row" data-table-id="ls2bw9dtr6m" data-row-id="bztm23s128n"><td class="ql-table-cell" data-table-id="ls2bw9dtr6m" data-row-id="bztm23s128n" data-col-id="p3imc1n7xlo" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="ls2bw9dtr6m" data-row-id="bztm23s128n" data-col-id="p3imc1n7xlo" data-rowspan="1" data-colspan="1"><ol><li data-list="ordered"><span class="ql-ui" contenteditable="false"></span>list order</li><li data-list="ordered" class="ql-indent-1"><span class="ql-ui" contenteditable="false"></span>aaa</li></ol></div></td><td class="ql-table-cell" data-table-id="ls2bw9dtr6m" data-row-id="bztm23s128n" data-col-id="ndvtber87yq" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="ls2bw9dtr6m" data-row-id="bztm23s128n" data-col-id="ndvtber87yq" data-rowspan="1" data-colspan="1"><ol><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span>list bullet</li></ol></div></td></tr><tr class="ql-table-row" data-table-id="ls2bw9dtr6m" data-row-id="3kx2tsgoao5"><td class="ql-table-cell" data-table-id="ls2bw9dtr6m" data-row-id="3kx2tsgoao5" data-col-id="p3imc1n7xlo" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="ls2bw9dtr6m" data-row-id="3kx2tsgoao5" data-col-id="p3imc1n7xlo" data-rowspan="1" data-colspan="1"><ol><li data-list="unchecked"><span class="ql-ui" contenteditable="false"></span>list checkbox</li><li data-list="checked"><span class="ql-ui" contenteditable="false"></span>checkbox checked</li></ol></div></td><td class="ql-table-cell" data-table-id="ls2bw9dtr6m" data-row-id="3kx2tsgoao5" data-col-id="ndvtber87yq" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="ls2bw9dtr6m" data-row-id="3kx2tsgoao5" data-col-id="ndvtber87yq" data-rowspan="1" data-colspan="1"><p><br></p></div></td></tr></tbody></table></div>' }),
    );
    await vi.runAllTimersAsync();

    expectDelta(
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { full: false, width: 583 } } },
        { insert: { 'table-up-col': { full: false, width: 583 } } },
        { insert: 'list order' },
        { attributes: { 'list': 'ordered', 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: 'aaa' },
        { attributes: { 'indent': 1, 'list': 'ordered', 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: 'list bullet' },
        { attributes: { 'list': 'bullet', 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: 'list checkbox' },
        { attributes: { 'list': 'unchecked', 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: 'checkbox checked' },
        { attributes: { 'list': 'checked', 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '\n' },
      ]),
      quill.getContents(),
    );
  });

  it('should convert html blockquote correctly', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(quill.clipboard.convert({
      html: '<div class="ql-table-wrapper" data-table-id="8rqhkks1osv"><table class="ql-table" data-table-id="8rqhkks1osv" cellpadding="0" cellspacing="0" style="margin-right: auto; width: 1166px;"><colgroup data-table-id="8rqhkks1osv" contenteditable="false"><col width="583px" data-table-id="8rqhkks1osv" data-col-id="b947km1o14"><col width="583px" data-table-id="8rqhkks1osv" data-col-id="wo2geakh0g"></colgroup><tbody data-table-id="8rqhkks1osv"><tr class="ql-table-row" data-table-id="8rqhkks1osv" data-row-id="vx0l7y3du9f"><td class="ql-table-cell" data-table-id="8rqhkks1osv" data-row-id="vx0l7y3du9f" data-col-id="b947km1o14" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="8rqhkks1osv" data-row-id="vx0l7y3du9f" data-col-id="b947km1o14" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="8rqhkks1osv" data-row-id="vx0l7y3du9f" data-col-id="wo2geakh0g" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="8rqhkks1osv" data-row-id="vx0l7y3du9f" data-col-id="wo2geakh0g" data-rowspan="1" data-colspan="1"><p><br></p></div></td></tr><tr class="ql-table-row" data-table-id="8rqhkks1osv" data-row-id="udrwd720bo"><td class="ql-table-cell" data-table-id="8rqhkks1osv" data-row-id="udrwd720bo" data-col-id="b947km1o14" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="8rqhkks1osv" data-row-id="udrwd720bo" data-col-id="b947km1o14" data-rowspan="1" data-colspan="1"><p><br></p><blockquote>blockquote</blockquote><blockquote><br></blockquote></div></td><td class="ql-table-cell" data-table-id="8rqhkks1osv" data-row-id="udrwd720bo" data-col-id="wo2geakh0g" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="8rqhkks1osv" data-row-id="udrwd720bo" data-col-id="wo2geakh0g" data-rowspan="1" data-colspan="1"><p><br></p></div></td></tr></tbody></table></div>',
    }));
    await vi.runAllTimersAsync();

    expectDelta(
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { full: false, width: 583 } } },
        { insert: { 'table-up-col': { full: false, width: 583 } } },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: 'blockquote' },
        { attributes: { 'blockquote': true, 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n\n' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '\n' },
      ]),
      quill.getContents(),
    );
  });

  it('clipboard convert cell with block format html', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(
      quill.clipboard.convert({
        html: '<div class="ql-table-wrapper" data-table-id="9jypy709wki"><table class="ql-table" data-table-id="9jypy709wki" cellpadding="0" cellspacing="0" style="margin-right: auto; width: 1165px;"><colgroup data-table-id="9jypy709wki" contenteditable="false"><col width="233px" data-table-id="9jypy709wki" data-col-id="jsvukntxx7c"><col width="233px" data-table-id="9jypy709wki" data-col-id="esm3ms8zxic"><col width="233px" data-table-id="9jypy709wki" data-col-id="wwbiyp73ajj"><col width="233px" data-table-id="9jypy709wki" data-col-id="bg5s13lbsi"><col width="233px" data-table-id="9jypy709wki" data-col-id="bvwn2fw55xs"></colgroup><tbody data-table-id="9jypy709wki"><tr class="ql-table-row" data-table-id="9jypy709wki" data-row-id="xxuv456bqr"><td class="ql-table-cell" data-table-id="9jypy709wki" data-row-id="xxuv456bqr" data-col-id="jsvukntxx7c" rowspan="3" colspan="2"><div class="ql-table-cell-inner" data-table-id="9jypy709wki" data-row-id="xxuv456bqr" data-col-id="jsvukntxx7c" data-rowspan="3" data-colspan="2"><p><br></p><div class="ql-code-block-container" spellcheck="false"><div class="ql-code-block" data-language="plain">qweqwe</div><div class="ql-code-block" data-language="plain">123123</div></div></div></td><td class="ql-table-cell" data-table-id="9jypy709wki" data-row-id="xxuv456bqr" data-col-id="wwbiyp73ajj" rowspan="1" colspan="3"><div class="ql-table-cell-inner" data-table-id="9jypy709wki" data-row-id="xxuv456bqr" data-col-id="wwbiyp73ajj" data-rowspan="1" data-colspan="3"><p><br></p></div></td></tr><tr class="ql-table-row" data-table-id="9jypy709wki" data-row-id="oke9hba31p"><td class="ql-table-cell" data-table-id="9jypy709wki" data-row-id="oke9hba31p" data-col-id="wwbiyp73ajj" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="9jypy709wki" data-row-id="oke9hba31p" data-col-id="wwbiyp73ajj" data-rowspan="1" data-colspan="1"><h1>12345</h1><p>blank</p><h1>qwert</h1></div></td><td class="ql-table-cell" data-table-id="9jypy709wki" data-row-id="oke9hba31p" data-col-id="bg5s13lbsi" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="9jypy709wki" data-row-id="oke9hba31p" data-col-id="bg5s13lbsi" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="9jypy709wki" data-row-id="oke9hba31p" data-col-id="bvwn2fw55xs" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="9jypy709wki" data-row-id="oke9hba31p" data-col-id="bvwn2fw55xs" data-rowspan="1" data-colspan="1"><ol><li data-list="unchecked"><span class="ql-ui" contenteditable="false"></span>check</li><li data-list="checked"><span class="ql-ui" contenteditable="false"></span>checked</li></ol></div></td></tr><tr class="ql-table-row" data-table-id="9jypy709wki" data-row-id="syesyrm0dyj"><td class="ql-table-cell" data-table-id="9jypy709wki" data-row-id="syesyrm0dyj" data-col-id="wwbiyp73ajj" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="9jypy709wki" data-row-id="syesyrm0dyj" data-col-id="wwbiyp73ajj" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="9jypy709wki" data-row-id="syesyrm0dyj" data-col-id="bg5s13lbsi" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="9jypy709wki" data-row-id="syesyrm0dyj" data-col-id="bg5s13lbsi" data-rowspan="1" data-colspan="1"><ol><li data-list="ordered"><span class="ql-ui" contenteditable="false"></span>list</li><li data-list="ordered"><span class="ql-ui" contenteditable="false"></span>list</li></ol></div></td><td class="ql-table-cell" data-table-id="9jypy709wki" data-row-id="syesyrm0dyj" data-col-id="bvwn2fw55xs" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="9jypy709wki" data-row-id="syesyrm0dyj" data-col-id="bvwn2fw55xs" data-rowspan="1" data-colspan="1"><p><br></p></div></td></tr><tr class="ql-table-row" data-table-id="9jypy709wki" data-row-id="46snirypksr"><td class="ql-table-cell" data-table-id="9jypy709wki" data-row-id="46snirypksr" data-col-id="jsvukntxx7c" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="9jypy709wki" data-row-id="46snirypksr" data-col-id="jsvukntxx7c" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="9jypy709wki" data-row-id="46snirypksr" data-col-id="esm3ms8zxic" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="9jypy709wki" data-row-id="46snirypksr" data-col-id="esm3ms8zxic" data-rowspan="1" data-colspan="1"><blockquote>qoute</blockquote><blockquote><br></blockquote></div></td><td class="ql-table-cell" data-table-id="9jypy709wki" data-row-id="46snirypksr" data-col-id="wwbiyp73ajj" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="9jypy709wki" data-row-id="46snirypksr" data-col-id="wwbiyp73ajj" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="9jypy709wki" data-row-id="46snirypksr" data-col-id="bg5s13lbsi" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="9jypy709wki" data-row-id="46snirypksr" data-col-id="bg5s13lbsi" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="9jypy709wki" data-row-id="46snirypksr" data-col-id="bvwn2fw55xs" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="9jypy709wki" data-row-id="46snirypksr" data-col-id="bvwn2fw55xs" data-rowspan="1" data-colspan="1"><p><br></p></div></td></tr></tbody></table></div>',
      }),
    );
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0">
            ${createTaleColHTML(5, { width: 233, full: false })}
            <tbody>
              <tr>
                <td rowspan="3" colspan="2">
                  <div data-rowspan="3" data-colspan="2">
                    <p><br></p>
                    <div spellcheck="false">
                      <div data-language="plain">qweqwe</div>
                      <div data-language="plain">123123</div>
                    </div>
                  </div>
                </td>
                <td rowspan="1" colspan="3">
                  <div data-rowspan="1" data-colspan="3"><p><br></p></div>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1">
                    <h1>12345</h1>
                    <p>blank</p>
                    <h1>qwert</h1>
                  </div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1">
                    <ol>
                      <li data-list="unchecked">check</li>
                      <li data-list="checked">checked</li>
                    </ol>
                  </div>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1">
                    <ol>
                      <li data-list="ordered">list</li>
                      <li data-list="ordered">list</li>
                    </ol>
                  </div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1">
                    <blockquote>qoute</blockquote>
                    <blockquote><br></blockquote>
                  </div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'contenteditable'] },
    );
  });

  it('clipboard conver multiple formats and attributes', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(
      quill.clipboard.convert({
        html: `<div class="ql-table-wrapper" data-table-id="axky6ertrbo" contenteditable="false"><table class="ql-table" data-table-id="axky6ertrbo" cellpadding="0" cellspacing="0" style="margin-right: auto; width: 300px;"><colgroup data-table-id="axky6ertrbo" contenteditable="false"><col width="100px" data-table-id="axky6ertrbo" data-col-id="udqfzpmf4m"><col width="100px" data-table-id="axky6ertrbo" data-col-id="uu5nfqzcbx"><col width="100px" data-table-id="axky6ertrbo" data-col-id="y6bmdvnbnr"></colgroup><tbody data-table-id="axky6ertrbo"><tr class="ql-table-row" data-table-id="axky6ertrbo" data-row-id="829isdm1k8k"><td class="ql-table-cell" data-table-id="axky6ertrbo" data-row-id="829isdm1k8k" data-col-id="udqfzpmf4m" rowspan="1" colspan="1" style="height: 90px; background-color: rgb(94, 255, 0);"><div class="ql-table-cell-inner" data-table-id="axky6ertrbo" data-row-id="829isdm1k8k" data-col-id="udqfzpmf4m" data-rowspan="1" data-colspan="1" data-style="height: 90px; background-color: rgb(94, 255, 0);" contenteditable="true"><p><span style="color: rgb(230, 0, 0); background-color: rgb(0, 102, 204);">qwf</span></p></div></td><td class="ql-table-cell" data-table-id="axky6ertrbo" data-row-id="829isdm1k8k" data-col-id="uu5nfqzcbx" rowspan="2" colspan="1" style="height: 90px;"><div class="ql-table-cell-inner" data-table-id="axky6ertrbo" data-row-id="829isdm1k8k" data-col-id="uu5nfqzcbx" data-rowspan="2" data-colspan="1" data-style="height: 90px;" contenteditable="true"><blockquote><code style="background-color: rgb(0, 102, 204); color: rgb(230, 0, 0);">qwfqwfw</code></blockquote><ol><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span>qwg<sub>qwg</sub><sub style="background-color: rgb(0, 102, 204);">wqg</sub></li></ol></div></td><td class="ql-table-cell" data-table-id="axky6ertrbo" data-row-id="829isdm1k8k" data-col-id="y6bmdvnbnr" rowspan="1" colspan="1" style="height: 90px;"><div class="ql-table-cell-inner" data-table-id="axky6ertrbo" data-row-id="829isdm1k8k" data-col-id="y6bmdvnbnr" data-rowspan="1" data-colspan="1" data-style="height: 90px;" contenteditable="true"><p><span style="background-color: rgb(0, 102, 204);">qwg</span></p></div></td></tr><tr class="ql-table-row" data-table-id="axky6ertrbo" data-row-id="t6g1uhxx78"><td class="ql-table-cell" data-table-id="axky6ertrbo" data-row-id="t6g1uhxx78" data-col-id="udqfzpmf4m" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="axky6ertrbo" data-row-id="t6g1uhxx78" data-col-id="udqfzpmf4m" data-rowspan="1" data-colspan="1" contenteditable="true"><p><br></p></div></td><td class="ql-table-cell" data-table-id="axky6ertrbo" data-row-id="t6g1uhxx78" data-col-id="y6bmdvnbnr" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="axky6ertrbo" data-row-id="t6g1uhxx78" data-col-id="y6bmdvnbnr" data-rowspan="1" data-colspan="1" contenteditable="true"><p><br></p></div></td></tr><tr class="ql-table-row" data-table-id="axky6ertrbo" data-row-id="eqkvtvxxk64"><td class="ql-table-cell" data-table-id="axky6ertrbo" data-row-id="eqkvtvxxk64" data-col-id="udqfzpmf4m" rowspan="1" colspan="2"><div class="ql-table-cell-inner" data-table-id="axky6ertrbo" data-row-id="eqkvtvxxk64" data-col-id="udqfzpmf4m" data-rowspan="1" data-colspan="2" contenteditable="true"><div class="ql-code-block-container" spellcheck="false"><div class="ql-code-block" data-language="plain">qwgwqgwgqwg</div></div></div></td><td class="ql-table-cell" data-table-id="axky6ertrbo" data-row-id="eqkvtvxxk64" data-col-id="y6bmdvnbnr" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="axky6ertrbo" data-row-id="eqkvtvxxk64" data-col-id="y6bmdvnbnr" data-rowspan="1" data-colspan="1" contenteditable="true"><p><strong class="ql-font-monospace ql-size-large"><em><s><u>qwgwqg</u></s></em></strong></p></div></td></tr></tbody></table></div>`,
      }),
    );
    await vi.runAllTimersAsync();

    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" style="margin-right: auto; width: 300px;">
            ${createTaleColHTML(3, { full: false, width: 100 })}
            <tbody>
              <tr>
                <td rowspan="1" colspan="1" style="height: 90px; background-color: rgb(94, 255, 0);">
                  <div data-style="height: 90px; background-color: rgb(94, 255, 0);">
                    <p>
                      <span style="background-color: rgb(0, 102, 204); color: rgb(230, 0, 0);">qwf</span>
                    </p>
                  </div>
                </td>
                <td rowspan="2" colspan="1" style="height: 90px;">
                  <div data-style="height: 90px;">
                    <blockquote><code style="color: rgb(230, 0, 0); background-color: rgb(0, 102, 204);">qwfqwfw</code></blockquote>
                    <ol>
                      <li data-list="bullet">
                        <span class="ql-ui" contenteditable="false"></span>qwg<sub>qwg</sub>
                        <sub style="background-color: rgb(0, 102, 204);">wqg</sub>
                      </li>
                    </ol>
                  </div>
                </td>
                <td rowspan="1" colspan="1" style="height: 90px;">
                  <div data-style="height: 90px;">
                    <p>
                      <span style="background-color: rgb(0, 102, 204);">qwg</span>
                    </p>
                  </div>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1">
                  <div>
                    <p><br></p>
                  </div>
                </td>
                <td rowspan="1" colspan="1">
                  <div>
                    <p><br></p>
                  </div>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="2">
                  <div>
                    <div class="ql-code-block-container" spellcheck="false">
                      <div class="ql-code-block" data-language="plain">qwgwqgwgqwg</div>
                    </div>
                  </div>
                </td>
                <td rowspan="1" colspan="1">
                  <div>
                    <p><strong class="ql-size-large ql-font-monospace"><em><s><u>qwgwqg</u></s></em></strong></p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      {
        ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'],
      },
    );
  });

  it('clipboard convert cell with background on tr', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, { full: false });
    // color convert hex in quill internal
    quill.setContents(
      quill.clipboard.convert({
        html: `
          <table>
            <tbody>
              <tr style="background-color: rgb(237, 238, 242);">
                <td>1</th>
                <td>2</td>
                <td>3</td>
              </tr>
              <tr>
                <td>4</th>
                <td>5</td>
                <td>6</td>
              </tr>
              <tr style="background-color: rgb(237, 238, 242);">
                <td>7</th>
                <td>8</td>
                <td>9</td>
              </tr>
            </tbody>
          </table>
        `,
      }),
    );
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" style="margin-right: auto; width: 300px;">
            ${createTaleColHTML(3, { width: 100, full: false })}
            <tbody>
              <tr>
                <td style="background-color: rgb(237, 238, 242);">
                  <div data-style="background-color: rgb(237, 238, 242);">
                    <p><span style="background-color: rgb(237, 238, 242);">1</span></p>
                  </div>
                </td>
                <td style="background-color: rgb(237, 238, 242);">
                  <div data-style="background-color: rgb(237, 238, 242);">
                    <p><span style="background-color: rgb(237, 238, 242);">2</span></p>
                  </div>
                </td>
                <td style="background-color: rgb(237, 238, 242);">
                  <div data-style="background-color: rgb(237, 238, 242);">
                    <p><span style="background-color: rgb(237, 238, 242);">3</span></p>
                  </div>
                </td>
              </tr>
              <tr>
                <td>
                  <div>
                    <p>4</p>
                  </div>
                </td>
                <td>
                  <div>
                    <p>5</p>
                  </div>
                </td>
                <td>
                  <div>
                    <p>6</p>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="background-color: rgb(237, 238, 242);">
                  <div data-style="background-color: rgb(237, 238, 242);">
                    <p><span style="background-color: rgb(237, 238, 242);">7</span></p>
                  </div>
                </td>
                <td style="background-color: rgb(237, 238, 242);">
                  <div data-style="background-color: rgb(237, 238, 242);">
                    <p><span style="background-color: rgb(237, 238, 242);">8</span></p>
                  </div>
                </td>
                <td style="background-color: rgb(237, 238, 242);">
                  <div data-style="background-color: rgb(237, 238, 242);">
                    <p><span style="background-color: rgb(237, 238, 242);">9</span></p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'colspan', 'rowspan', 'data-colspan', 'data-rowspan', 'data-table-id', 'data-row-id', 'data-col-id', 'contenteditable'] },
    );
    expectDelta(
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { full: false, width: 100 } } },
        { insert: { 'table-up-col': { full: false, width: 100 } } },
        { insert: { 'table-up-col': { full: false, width: 100 } } },
        { attributes: { background: '#edeef2' }, insert: '1' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1, style: 'background-color: rgb(237, 238, 242);' } }, insert: '\n' },
        { attributes: { background: '#edeef2' }, insert: '2' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1, style: 'background-color: rgb(237, 238, 242);' } }, insert: '\n' },
        { attributes: { background: '#edeef2' }, insert: '3' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1, style: 'background-color: rgb(237, 238, 242);' } }, insert: '\n' },
        { insert: '4' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '5' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '6' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { attributes: { background: '#edeef2' }, insert: '7' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1, style: 'background-color: rgb(237, 238, 242);' } }, insert: '\n' },
        { attributes: { background: '#edeef2' }, insert: '8' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1, style: 'background-color: rgb(237, 238, 242);' } }, insert: '\n' },
        { attributes: { background: '#edeef2' }, insert: '9' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1, style: 'background-color: rgb(237, 238, 242);' } }, insert: '\n' },
        { insert: '\n' },
      ]),
      quill.getContents(),
    );
  });
});

describe('clipboard cell in cell', () => {
  it('paste simple text into table', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(createTableDeltaOps(1, 1, { full: false, width: 100 }, {}, { isEmpty: true }));
    await vi.runAllTimersAsync();
    await simulatePasteHTML(
      quill,
      { index: 2, length: 0 },
      '<html><body><!--StartFragment--><p >text</p><p>123</p><!--EndFragment--></body></html>',
    );

    expectDelta(
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { full: false, width: 100 } } },
        { insert: 'text' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '123' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '\n' },
      ]),
      quill.getContents(),
    );
  });

  it('paste format text into table', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(createTableDeltaOps(1, 1, { full: false, width: 100 }, {}, { isEmpty: true }));
    await vi.runAllTimersAsync();
    await simulatePasteHTML(
      quill,
      { index: 2, length: 0 },
      '<html>\r\n<body>\r\n\u003C!--StartFragment--><h1>123</h1><p></p><p><strong style="color: rgb(230, 0, 0); background-color: rgb(0, 0, 0);"><em><s><u>123</u></s></em></strong><sub style="color: rgb(230, 0, 0); background-color: rgb(0, 0, 0);"><strong><em><s><u>qwe</u></s></em></strong></sub></p>\u003C!--EndFragment-->\r\n</body>\r\n</html>',
    );

    expectDelta(
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { full: false, width: 100 } } },
        { insert: '123' },
        { attributes: { 'header': 1, 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { attributes: { underline: true, strike: true, italic: true, background: '#000000', color: '#e60000', bold: true }, insert: '123' },
        { attributes: { underline: true, strike: true, italic: true, bold: true, background: '#000000', color: '#e60000', script: 'sub' }, insert: 'qwe' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '\n' },
      ]),
      quill.getContents(),
    );
  });

  it('paste cell text into table', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(createTableDeltaOps(1, 1, { full: false, width: 100 }, {}, { isEmpty: true }));
    await vi.runAllTimersAsync();
    const range = { index: 2, length: 0 };
    quill.setSelection(range);
    quill.clipboard.onPaste(
      range,
      { html: '<html>\r\n<body>\r\n\u003C!--StartFragment--><div class="ql-table-wrapper" data-table-id="8v36875pbr6"><table class="ql-table" data-table-id="8v36875pbr6" data-full="true" cellpadding="0" cellspacing="0" style="margin-right: auto;"><tbody data-table-id="8v36875pbr6"><tr class="ql-table-row" data-table-id="8v36875pbr6" data-row-id="zjhlbpvwjo"><td class="ql-table-cell" data-table-id="8v36875pbr6" data-row-id="zjhlbpvwjo" data-col-id="y0epsy6odnm" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="8v36875pbr6" data-row-id="zjhlbpvwjo" data-col-id="y0epsy6odnm" data-rowspan="1" data-colspan="1"><p>5</p><p></p><p>q</p></div></td></tr></tbody></table></div>\u003C!--EndFragment-->\r\n</body>\r\n</html>' },
    );
    await vi.runAllTimersAsync();

    expectDelta(
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { full: false, width: 100 } } },
        { insert: '5' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n\n' },
        { insert: 'q' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n\n' },
        { insert: '\n' },
      ]),
      quill.getContents(),
    );
  });

  it('paste cell with format text into table', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(createTableDeltaOps(1, 1, { full: false, width: 100 }, {}, { isEmpty: true }));
    await vi.runAllTimersAsync();
    const range = { index: 2, length: 0 };
    quill.setSelection(range);
    quill.clipboard.onPaste(
      range,
      { html: '<html>\r\n<body>\r\n\u003C!--StartFragment--><div class="ql-table-wrapper" data-table-id="8v36875pbr6"><table class="ql-table" data-table-id="8v36875pbr6" data-full="true" cellpadding="0" cellspacing="0" style="margin-right: auto;"><tbody data-table-id="8v36875pbr6"><tr class="ql-table-row" data-table-id="8v36875pbr6" data-row-id="zjhlbpvwjo"><td class="ql-table-cell" data-table-id="8v36875pbr6" data-row-id="zjhlbpvwjo" data-col-id="gpais2dyp87" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="8v36875pbr6" data-row-id="zjhlbpvwjo" data-col-id="gpais2dyp87" data-rowspan="1" data-colspan="1"><h1>123</h1><p></p><p><strong><em><s><u>123</u></s></em></strong><sub><strong><em><s><u>qwe</u></s></em></strong></sub><sup><strong><em><s><u>qwe</u></s></em></strong></sup></p></div></td></tr></tbody></table></div>\u003C!--EndFragment-->\r\n</body>\r\n</html>' },
    );
    await vi.runAllTimersAsync();

    expectDelta(
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { full: false, width: 100 } } },
        { insert: '123' },
        { attributes: { 'header': 1, 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
        { attributes: { underline: true, strike: true, italic: true, bold: true }, insert: '123' },
        { attributes: { underline: true, strike: true, italic: true, bold: true, script: 'sub' }, insert: 'qwe' },
        { attributes: { underline: true, strike: true, italic: true, bold: true, script: 'super' }, insert: 'qwe' },
        { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n\n' },
        { insert: '\n' },
      ]),
      quill.getContents(),
    );
  });
});

describe('test TableUp `getHTMLByCell`', () => {
  it('getHTMLByCell return cell html', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(createTableDeltaOps(4, 4, { full: true }, {}, { isEmpty: false }));

    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[0], tds[1], tds[4], tds[5]]);
    await vi.runAllTimersAsync();

    const html = tableModule.getHTMLByCell([tds[0], tds[2], tds[6]]);
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const htmlCols = Array.from(doc.querySelectorAll('col'));
    const htmlTds = Array.from(doc.querySelectorAll('td'));
    expect(htmlCols.length).toBe(3);
    expect(htmlTds.length).toBe(3);
    for (const col of htmlCols) {
      expect(col.getAttribute('width')).toBe('33%');
    }
  });
});

describe('clipboard style block resolution', () => {
  it('class-based background-color is preserved on table cell', () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, { pasteStyleSheet: true });
    const delta = quill.clipboard.convert({
      html: '<style>.xl65{background-color:#FFC000}</style><table><tr><td class="xl65">text</td></tr></table>',
    });
    const cellOp = delta.ops.find(op => op.attributes?.['table-up-cell-inner']);
    expect(cellOp).toBeDefined();
    const style = (cellOp!.attributes!['table-up-cell-inner'] as any).style;
    expect(style).toContain('background-color');
    expect(style).toMatch(/#FFC000|rgb\(255, 192, 0\)/i);
  });

  it('class-based color is preserved as Quill inline format', () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, { pasteStyleSheet: true });
    const delta = quill.clipboard.convert({
      html: '<style>.xl65{color:red}</style><table><tr><td class="xl65">text</td></tr></table>',
    });
    // text and \n may be merged into a single op when attributes match
    const textOp = delta.ops.find(op => typeof op.insert === 'string' && (op.insert as string).includes('text'));
    expect(textOp).toBeDefined();
    expect(textOp!.attributes?.color).toBeTruthy();
  });

  it('class-based bold is preserved as Quill inline format', () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, { pasteStyleSheet: true });
    const delta = quill.clipboard.convert({
      html: '<style>.xl65{font-weight:bold}</style><table><tr><td class="xl65">text</td></tr></table>',
    });
    // text and \n may be merged into a single op when attributes match
    const textOp = delta.ops.find(op => typeof op.insert === 'string' && (op.insert as string).includes('text'));
    expect(textOp).toBeDefined();
    expect(textOp!.attributes?.bold).toBe(true);
  });

  it('inline style takes priority over class style', () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, { pasteStyleSheet: true });
    const delta = quill.clipboard.convert({
      html: '<style>.xl65{background-color:red}</style><table><tr><td class="xl65" style="background-color:blue">text</td></tr></table>',
    });
    const cellOp = delta.ops.find(op => op.attributes?.['table-up-cell-inner']);
    expect(cellOp).toBeDefined();
    const style = (cellOp!.attributes!['table-up-cell-inner'] as any).style;
    expect(style).toContain('background-color');
    expect(style).toMatch(/blue/i);
    expect(style).not.toMatch(/red/i);
  });

  it('@-rules are skipped without error', () => {
    const rules = parseCSSRules('@page{margin:1in} .xl65{background:red}');
    expect(rules.length).toBe(1);
    expect(rules[0].selector).toBe('.xl65');
    expect(rules[0].styles.background).toBe('red');
  });

  it('multiple style blocks are all processed', () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, { pasteStyleSheet: true });
    const delta = quill.clipboard.convert({
      html: '<style>.a{background-color:red}</style><style>.b{background-color:blue}</style><table><tr><td class="a">A</td><td class="b">B</td></tr></table>',
    });
    const cellOps = delta.ops.filter(op => op.attributes?.['table-up-cell-inner']);
    expect(cellOps.length).toBeGreaterThanOrEqual(2);
    expect((cellOps[0].attributes!['table-up-cell-inner'] as any).style).toContain('background-color');
    expect((cellOps[1].attributes!['table-up-cell-inner'] as any).style).toContain('background-color');
  });

  it('simple tag selectors (td) are skipped by default', () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, { pasteStyleSheet: true });
    const delta = quill.clipboard.convert({
      html: '<style>td{background-color:red} .xl65{background-color:blue}</style><table><tr><td class="xl65">text</td></tr></table>',
    });
    const cellOp = delta.ops.find(op => op.attributes?.['table-up-cell-inner']);
    expect(cellOp).toBeDefined();
    const style = (cellOp!.attributes!['table-up-cell-inner'] as any).style;
    // class selector applied, tag selector skipped
    expect(style).toMatch(/blue/i);
  });

  it('descendant tag selectors (table td) are skipped by default', () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, { pasteStyleSheet: true });
    const delta = quill.clipboard.convert({
      html: '<style>table td{background-color:red} .xl65{background-color:blue}</style><table><tr><td class="xl65">text</td></tr></table>',
    });
    const cellOp = delta.ops.find(op => op.attributes?.['table-up-cell-inner']);
    expect(cellOp).toBeDefined();
    const style = (cellOp!.attributes!['table-up-cell-inner'] as any).style;
    expect(style).toMatch(/blue/i);
    expect(style).not.toMatch(/red/i);
  });

  it('child combinator tag selectors (tr > td) are skipped by default', () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, { pasteStyleSheet: true });
    const delta = quill.clipboard.convert({
      html: '<style>tr > td{background-color:red}</style><table><tr><td>text</td></tr></table>',
    });
    const cellOp = delta.ops.find(op => op.attributes?.['table-up-cell-inner']);
    expect(cellOp).toBeDefined();
    const style = (cellOp!.attributes!['table-up-cell-inner'] as any).style || '';
    expect(style).not.toContain('background-color');
  });

  it('deep combinator tag selectors (table > tbody > tr > td) are skipped by default', () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, { pasteStyleSheet: true });
    const delta = quill.clipboard.convert({
      html: '<style>table > tbody > tr > td{background-color:red}</style><table><tbody><tr><td>text</td></tr></tbody></table>',
    });
    const cellOp = delta.ops.find(op => op.attributes?.['table-up-cell-inner']);
    expect(cellOp).toBeDefined();
    const style = (cellOp!.attributes!['table-up-cell-inner'] as any).style || '';
    expect(style).not.toContain('background-color');
  });

  it('sibling combinator tag selectors (td + td) are skipped by default', () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, { pasteStyleSheet: true });
    const delta = quill.clipboard.convert({
      html: '<style>td + td{background-color:red}</style><table><tr><td>a</td><td>b</td></tr></table>',
    });
    const cellOps = delta.ops.filter(op => op.attributes?.['table-up-cell-inner']);
    for (const op of cellOps) {
      const style = (op.attributes!['table-up-cell-inner'] as any).style || '';
      expect(style).not.toContain('background-color');
    }
  });

  it('tag+class selectors (td.xl65) are NOT skipped', () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, { pasteStyleSheet: true });
    const delta = quill.clipboard.convert({
      html: '<style>td.xl65{background-color:red}</style><table><tr><td class="xl65">text</td></tr></table>',
    });
    const cellOp = delta.ops.find(op => op.attributes?.['table-up-cell-inner']);
    expect(cellOp).toBeDefined();
    const style = (cellOp!.attributes!['table-up-cell-inner'] as any).style;
    expect(style).toContain('background-color');
  });

  it('tag+id selectors (td#main) are NOT skipped', () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, { pasteStyleSheet: true });
    const delta = quill.clipboard.convert({
      html: '<style>td#main{background-color:red}</style><table><tr><td id="main">text</td></tr></table>',
    });
    const cellOp = delta.ops.find(op => op.attributes?.['table-up-cell-inner']);
    expect(cellOp).toBeDefined();
    const style = (cellOp!.attributes!['table-up-cell-inner'] as any).style;
    expect(style).toContain('background-color');
  });

  it('tag+attribute selectors (td[data-x]) are NOT skipped', () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, { pasteStyleSheet: true });
    const delta = quill.clipboard.convert({
      html: '<style>td[data-x]{background-color:red}</style><table><tr><td data-x="1">text</td></tr></table>',
    });
    const cellOp = delta.ops.find(op => op.attributes?.['table-up-cell-inner']);
    expect(cellOp).toBeDefined();
    const style = (cellOp!.attributes!['table-up-cell-inner'] as any).style;
    expect(style).toContain('background-color');
  });

  it('class descendant tag selectors (.cls td) are NOT skipped', () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, { pasteStyleSheet: true });
    const delta = quill.clipboard.convert({
      html: '<style>.wrap td{background-color:#FFC000}</style><table class="wrap"><tr><td>text</td></tr></table>',
    });
    const cellOp = delta.ops.find(op => op.attributes?.['table-up-cell-inner']);
    expect(cellOp).toBeDefined();
    const style = (cellOp!.attributes!['table-up-cell-inner'] as any).style;
    expect(style).toContain('background-color');
    expect(style).toMatch(/#FFC000|rgb\(255, 192, 0\)/i);
  });

  it('pseudo selectors (td:first-child) are NOT skipped', () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, { pasteStyleSheet: true });
    const delta = quill.clipboard.convert({
      html: '<style>td:first-child{background-color:red}</style><table><tr><td>a</td><td>b</td></tr></table>',
    });
    const cellOps = delta.ops.filter(op => op.attributes?.['table-up-cell-inner']);
    // first cell should have background-color, second should not
    const styles = cellOps.map(op => (op.attributes!['table-up-cell-inner'] as any).style || '');
    expect(styles.some(s => s.includes('background-color'))).toBe(true);
    expect(styles.some(s => !s.includes('background-color'))).toBe(true);
  });

  it('comma-separated mixed selectors skip only the tag-only parts', () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, { pasteStyleSheet: true });
    const delta = quill.clipboard.convert({
      html: '<style>td, .xl65{background-color:red}</style><table><tr><td class="xl65">text</td></tr></table>',
    });
    const cellOp = delta.ops.find(op => op.attributes?.['table-up-cell-inner']);
    expect(cellOp).toBeDefined();
    const style = (cellOp!.attributes!['table-up-cell-inner'] as any).style;
    // ".xl65" part applied (tag "td" part skipped, but .xl65 matches the same element)
    expect(style).toContain('background-color');
  });

  it('complex tag selectors are applied when pasteDefaultTagStyle is true', () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, { pasteStyleSheet: true, pasteDefaultTagStyle: true });
    const delta = quill.clipboard.convert({
      html: '<style>table td{background-color:red}</style><table><tr><td>text</td></tr></table>',
    });
    const cellOp = delta.ops.find(op => op.attributes?.['table-up-cell-inner']);
    expect(cellOp).toBeDefined();
    const style = (cellOp!.attributes!['table-up-cell-inner'] as any).style;
    expect(style).toContain('background-color');
  });

  it('pasteStyleSheet=false disables style resolution', () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, { pasteStyleSheet: false });
    const delta = quill.clipboard.convert({
      html: '<style>.xl65{background-color:#FFC000}</style><table><tr><td class="xl65">text</td></tr></table>',
    });
    const cellOp = delta.ops.find(op => op.attributes?.['table-up-cell-inner']);
    expect(cellOp).toBeDefined();
    const style = (cellOp!.attributes!['table-up-cell-inner'] as any).style || '';
    expect(style).not.toContain('background-color');
  });

  it('pasteDefaultTagStyle=true enables tag selector styles', () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, { pasteStyleSheet: true, pasteDefaultTagStyle: true });
    const delta = quill.clipboard.convert({
      html: '<style>td{background-color:#FFC000}</style><table><tr><td>text</td></tr></table>',
    });
    const cellOp = delta.ops.find(op => op.attributes?.['table-up-cell-inner']);
    expect(cellOp).toBeDefined();
    const style = (cellOp!.attributes!['table-up-cell-inner'] as any).style;
    expect(style).toContain('background-color');
  });
});

import type { EmitterSource, Op, Parchment as TypeParchment, Range as TypeRange } from 'quill';
import type { BlockEmbed as TypeBlockEmbed } from 'quill/blots/block';
import type TypeBlock from 'quill/blots/block';
import type { Context } from 'quill/modules/keyboard';
import type TypeKeyboard from 'quill/modules/keyboard';
import type TypeToolbar from 'quill/modules/toolbar';
import type { TableSelection } from './modules';
import type { Constructor, QuillTheme, QuillThemePicker, TableBodyTag, TableCellValue, TableConstantsData, TableTextOptions, TableUpOptions } from './utils';
import Quill from 'quill';
import { BlockEmbedOverride, BlockOverride, ContainerFormat, ScrollOverride, TableBodyFormat, TableCaptionFormat, TableCellFormat, TableCellInnerFormat, TableColFormat, TableColgroupFormat, TableFootFormat, TableHeadFormat, TableMainFormat, TableRowFormat, TableWrapperFormat } from './formats';
import { TableClipboard } from './modules';
import { blotName, createBEM, createSelectBox, cssTextToObject, debounce, findParentBlot, findParentBlots, getScrollBarWidth, isForbidInTable, isFunction, isNumber, isString, isSubclassOf, isUndefined, limitDomInViewPort, mixinClass, objectToCssText, randomId, tableCantInsert, tableUpEvent, tableUpInternal, tableUpSize, toCamelCase } from './utils';

const Parchment = Quill.import('parchment');
const Delta = Quill.import('delta');
const icons = Quill.import('ui/icons') as Record<string, any>;
const Break = Quill.import('blots/break') as TypeParchment.BlotConstructor;
const Block = Quill.import('blots/block') as typeof TypeBlock;
const BlockEmbed = Quill.import('blots/block/embed') as typeof TypeBlockEmbed;

function createCell(scroll: TypeParchment.ScrollBlot, { tableId, rowId, colId }: { tableId: string; rowId: string; colId: string }) {
  const value = {
    tableId,
    rowId,
    colId,
    colspan: 1,
    rowspan: 1,
  };
  const tableCell = scroll.create(blotName.tableCell, value) as TypeParchment.ParentBlot;
  const tableCellInner = scroll.create(blotName.tableCellInner, value) as TypeParchment.ParentBlot;
  const block = scroll.create('block') as TypeParchment.ParentBlot;
  block.appendChild(scroll.create('break'));
  tableCellInner.appendChild(block);
  tableCell.appendChild(tableCellInner);
  return tableCell;
}
export function updateTableConstants(data: Partial<TableConstantsData>) {
  tableCantInsert.delete(blotName.tableCellInner);

  Object.assign(blotName, data.blotName || {});
  Object.assign(tableUpSize, data.tableUpSize || {});
  Object.assign(tableUpEvent, data.tableUpEvent || {});
  Object.assign(tableUpInternal, data.tableUpInternal || {});

  TableUp.moduleName = tableUpInternal.moduleName;

  TableUp.toolName = blotName.tableWrapper;
  ContainerFormat.blotName = blotName.container;
  TableCaptionFormat.blotName = blotName.tableCaption;
  TableWrapperFormat.blotName = blotName.tableWrapper;
  TableMainFormat.blotName = blotName.tableMain;
  TableColgroupFormat.blotName = blotName.tableColgroup;
  TableColFormat.blotName = blotName.tableCol;
  TableHeadFormat.blotName = blotName.tableHead;
  TableBodyFormat.blotName = blotName.tableBody;
  TableFootFormat.blotName = blotName.tableFoot;
  TableRowFormat.blotName = blotName.tableRow;
  TableCellFormat.blotName = blotName.tableCell;
  TableCellInnerFormat.blotName = blotName.tableCellInner;

  tableCantInsert.add(blotName.tableCellInner);
}
export function defaultCustomSelect(tableModule: TableUp, picker: QuillThemePicker) {
  return createSelectBox({
    onSelect: (row: number, col: number) => {
      tableModule.insertTable(row, col, Quill.sources.USER);
      if (picker) {
        picker.close();
      }
    },
    customBtn: tableModule.options.customBtn,
    texts: tableModule.options.texts,
  });
}

function generateTableArrowHandler(up: boolean) {
  return {
    bindInHead: false,
    key: up ? 'ArrowUp' : 'ArrowDown',
    collapsed: true,
    format: [blotName.tableCellInner],
    handler(this: { quill: Quill }, range: TypeRange, context: Context) {
      const direction = up ? 'prev' : 'next';
      const childDirection = up ? 'tail' : 'head';
      if (context.line[direction]) return true;

      // TODO: if there have a very long text in cell, the line will auto wrap
      // there is no good way to find the correct index of the last `line`
      const cursorRect = this.quill.selection.getBounds(range.index);
      const lineRect = context.line.domNode.getBoundingClientRect();
      if (!cursorRect || !lineRect) return true;
      if (up) {
        if (cursorRect.top - lineRect.top > 3) {
          return true;
        }
      }
      else {
        if (lineRect.bottom - cursorRect.bottom > 3) {
          return true;
        }
      }

      let tableBlot: TableWrapperFormat;
      let tableMain: TableMainFormat;
      let tableRow: TableRowFormat;
      let tableCell: TableCellFormat;
      try {
        [tableBlot, tableMain, tableRow, tableCell] = findParentBlots(context.line, [blotName.tableWrapper, blotName.tableMain, blotName.tableRow, blotName.tableCell] as const);
      }
      catch {
        return true;
      }

      const colIds = tableMain.getColIds();
      const tableCaption = tableBlot.descendants(TableCaptionFormat, 0)[0];

      let aroundLine;
      if (tableCaption) {
        const captionSide = window.getComputedStyle(tableCaption.domNode);
        if (direction === 'next' && captionSide.captionSide === 'bottom') {
          aroundLine = tableCaption;
        }
        else if (direction === 'next') {
          aroundLine = tableBlot.next;
        }
        else {
          aroundLine = tableCaption;
        }
      }
      else {
        aroundLine = tableBlot[direction];
      }
      if (context.line[direction] || !aroundLine) return true;

      const targetRow = tableRow[direction] as TableRowFormat;
      if (targetRow) {
        const cellIndex = colIds.indexOf(tableCell.colId);
        const targetCell = targetRow.getCellByColId(colIds[cellIndex], direction);
        if (!targetCell) return true;
        let targetChild = targetCell.children[childDirection] as TypeParchment.ParentBlot;
        if (targetChild.children) {
          targetChild = targetChild.children[childDirection] as TypeParchment.ParentBlot;
        }
        const index = targetChild.offset(this.quill.scroll) + Math.min(context.offset, targetChild.length() - 1);
        this.quill.setSelection(index, 0, Quill.sources.USER);
      }
      else {
        const index = aroundLine.offset(this.quill.scroll) + (up ? aroundLine.length() - 1 : 0);
        this.quill.setSelection(index, 0, Quill.sources.USER);
      }
      return false;
    },
  };
}

export class TableUp {
  static moduleName: string = tableUpInternal.moduleName;
  static toolName: string = blotName.tableWrapper;
  // TODO: add custom property `bindInHead`, but Quill doesn't export `BindingObject`
  static keyboradHandler = {
    'forbid remove table by backspace': {
      bindInHead: true,
      key: 'Backspace',
      collapsed: true,
      offset: 0,
      handler(this: { quill: Quill }, range: TypeRange, context: Context) {
        const line = this.quill.getLine(range.index);
        const blot = line[0] as TypeParchment.BlockBlot;
        if (blot.prev instanceof TableWrapperFormat) {
          blot.prev.remove();
          return false;
        }

        if (context.format[blotName.tableCellInner]) {
          const offset = blot.offset(findParentBlot(blot, blotName.tableCellInner));
          if (offset === 0) {
            return false;
          }
        }

        return true;
      },
    },
    'forbid remove table by delete': {
      bindInHead: true,
      key: 'Delete',
      collapsed: true,
      handler(this: { quill: Quill }, range: TypeRange, context: Context) {
        const line = this.quill.getLine(range.index);
        const blot = line[0] as TypeParchment.BlockBlot;
        const offsetInline = line[1];
        if ((blot.next instanceof TableWrapperFormat || blot.next instanceof TableColFormat) && offsetInline === blot.length() - 1) return false;

        if (context.format[blotName.tableCellInner]) {
          const tableInnerBlot = findParentBlot(blot, blotName.tableCellInner);
          if (blot === tableInnerBlot.children.tail && offsetInline === blot.length() - 1) {
            return false;
          }
        }
        return true;
      },
    },
    'table up': generateTableArrowHandler(true),
    'table down': generateTableArrowHandler(false),
    'table caption break': {
      bindInHead: true,
      key: 'Enter',
      shiftKey: null,
      format: [blotName.tableCaption],
      handler(this: { quill: Quill }, _range: TypeRange, _context: Context) {
        return false;
      },
    },
  };

  static register() {
    TableWrapperFormat.allowedChildren = [TableMainFormat];

    TableMainFormat.allowedChildren = [TableColgroupFormat, TableCaptionFormat, TableHeadFormat, TableBodyFormat, TableFootFormat];
    TableMainFormat.requiredContainer = TableWrapperFormat;

    TableCaptionFormat.requiredContainer = TableMainFormat;

    TableColgroupFormat.allowedChildren = [TableColFormat];
    TableColgroupFormat.requiredContainer = TableMainFormat;

    TableHeadFormat.allowedChildren = [TableRowFormat];
    TableHeadFormat.requiredContainer = TableMainFormat;
    TableBodyFormat.allowedChildren = [TableRowFormat];
    TableBodyFormat.requiredContainer = TableMainFormat;
    TableFootFormat.allowedChildren = [TableRowFormat];
    TableFootFormat.requiredContainer = TableMainFormat;

    TableRowFormat.allowedChildren = [TableCellFormat];

    TableCellFormat.allowedChildren = [TableCellInnerFormat, Break];
    TableCellFormat.requiredContainer = TableRowFormat;

    TableCellInnerFormat.requiredContainer = TableCellFormat;

    // override Block and BlockEmbed
    const excludeFormat = new Set(['table']);
    const overrideFormats = Object.entries(Quill.imports as Record<string, Constructor>).filter(([name, blot]) => {
      const blotName = name.split('formats/')[1];
      return name.startsWith('formats/')
        && !excludeFormat.has(blotName)
        && (isSubclassOf(blot, Block) || isSubclassOf(blot, BlockEmbed));
    });
    const overrides = overrideFormats.reduce((pre, [name, blot]) => {
      const extendsClass = isSubclassOf(blot, BlockEmbed) ? BlockEmbedOverride : BlockOverride;
      pre[name] = class extends mixinClass(blot, [extendsClass]) {
        static register() {}
      };
      return pre;
    }, {} as Record<string, Constructor>);

    Quill.register({
      'blots/scroll': ScrollOverride,
      'blots/block': BlockOverride,
      'blots/block/embed': BlockEmbedOverride,
      ...overrides,
      [`blots/${blotName.container}`]: ContainerFormat,
      [`formats/${blotName.tableCell}`]: TableCellFormat,
      [`formats/${blotName.tableCellInner}`]: TableCellInnerFormat,
      [`formats/${blotName.tableRow}`]: TableRowFormat,
      [`formats/${blotName.tableHead}`]: TableHeadFormat,
      [`formats/${blotName.tableBody}`]: TableBodyFormat,
      [`formats/${blotName.tableFoot}`]: TableFootFormat,
      [`formats/${blotName.tableCol}`]: TableColFormat,
      [`formats/${blotName.tableColgroup}`]: TableColgroupFormat,
      [`formats/${blotName.tableCaption}`]: TableCaptionFormat,
      [`formats/${blotName.tableMain}`]: TableMainFormat,
      [`formats/${blotName.tableWrapper}`]: TableWrapperFormat,
      'modules/clipboard': TableClipboard,
    }, true);
  }

  quill: Quill;
  options: TableUpOptions;
  toolBox: HTMLDivElement;
  fixTableByLisenter = debounce(this.balanceTables, 100);
  selector?: HTMLElement;
  resizeOb!: ResizeObserver;
  editableObserver!: MutationObserver;
  modules: Record<string, Constructor> = {};

  get statics(): any {
    return this.constructor;
  }

  constructor(quill: Quill, options: Partial<TableUpOptions>) {
    this.quill = quill;
    this.options = this.resolveOptions(options || {});
    this.toolBox = this.initialContainer();

    const toolbar = this.quill.getModule('toolbar') as TypeToolbar;
    if (toolbar && (this.quill.theme as QuillTheme).pickers) {
      const [, select] = (toolbar.controls as [string, HTMLElement][] || []).find(([name]) => name === this.statics.toolName) || [];
      if (select && select.tagName.toLocaleLowerCase() === 'select') {
        const picker = (this.quill.theme as QuillTheme).pickers.find(picker => picker.select === select);
        if (picker) {
          picker.label.innerHTML = this.options.icon;
          this.buildCustomSelect(this.options.customSelect, picker);
          picker.label.addEventListener('mousedown', () => {
            if (!this.selector || !picker) return;
            const selectRect = this.selector.getBoundingClientRect();
            const { leftLimited } = limitDomInViewPort(selectRect);
            if (leftLimited) {
              const labelRect = picker.label.getBoundingClientRect();
              Object.assign(picker.options.style, { transform: `translateX(calc(-100% + ${labelRect.width}px))` });
            }
            else {
              Object.assign(picker.options.style, { transform: undefined });
            }
          });
        }
      }
    }

    const keyboard = this.quill.getModule('keyboard') as TypeKeyboard;
    for (const handle of Object.values(TableUp.keyboradHandler)) {
      // insert before default key handler
      if (handle.bindInHead) {
        keyboard.bindings[handle.key].unshift(handle);
      }
      else {
        keyboard.addBinding(handle.key, handle);
      }
    }

    this.initModules();
    this.listenEditableChange();
    this.quillHack();
    this.listenBalanceCells();
  }

  initialContainer() {
    const toolboxBEM = createBEM('toolbox');
    const container = this.quill.addContainer(toolboxBEM.b());
    const updateContainerStyle = () => {
      const quillRootRect = this.quill.root.getBoundingClientRect();
      const { offsetLeft, offsetTop } = this.quill.root;
      Object.assign(container.style, {
        top: `${offsetTop}px`,
        left: `${offsetLeft}px`,
        width: `${quillRootRect.width}px`,
        height: `${quillRootRect.height}px`,
      });
    };
    this.resizeOb = new ResizeObserver(updateContainerStyle);
    this.resizeOb.observe(this.quill.root);
    return container;
  }

  addContainer(classes: string | HTMLElement) {
    if (isString(classes)) {
      const el = document.createElement('div');
      for (const classname of classes.split(' ')) {
        el.classList.add(classname);
      }
      this.toolBox.appendChild(el);
      return el;
    }
    else {
      this.toolBox.appendChild(classes);
      return classes;
    }
  }

  resolveOptions(options: Partial<TableUpOptions>): TableUpOptions {
    return Object.assign({
      customBtn: false,
      texts: this.resolveTexts(options.texts || {}),
      full: false,
      fullSwitch: true,
      icon: icons.table,
      autoMergeCell: true,
      modules: [],
    } as TableUpOptions, options);
  }

  resolveTexts(options: Partial<TableTextOptions>) {
    return Object.assign({
      fullCheckboxText: 'Insert full width table',
      customBtnText: 'Custom',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      rowText: 'Row',
      colText: 'Column',
      notPositiveNumberError: 'Please enter a positive integer',
      custom: 'Custom',
      clear: 'Clear',
      transparent: 'Transparent',
      perWidthInsufficient: 'The percentage width is insufficient. To complete the operation, the table needs to be converted to a fixed width. Do you want to continue?',
      CopyCell: 'Copy cell',
      CutCell: 'Cut cell',
      InsertTop: 'Insert row above',
      InsertRight: 'Insert column right',
      InsertBottom: 'Insert row below',
      InsertLeft: 'Insert column Left',
      MergeCell: 'Merge Cell',
      SplitCell: 'Split Cell',
      DeleteRow: 'Delete Row',
      DeleteColumn: 'Delete Column',
      DeleteTable: 'Delete table',
      BackgroundColor: 'Set background color',
      BorderColor: 'Set border color',
    }, options);
  }

  initModules() {
    // should not initModules in read-only mode
    if (!this.quill.isEnabled() || this.quill.options.readOnly) {
      return;
    }
    for (const item of this.options.modules) {
      this.modules[item.module.moduleName] = new item.module(this, this.quill, item.options);
    }
  }

  listenEditableChange() {
    // listen editable change
    this.editableObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'contenteditable') {
          const isEditable = this.quill.root.getAttribute('contenteditable') !== 'false';
          if (!isEditable) {
            this.destroyModules();
          }
          else {
            this.initModules();
          }
          break;
        }
      }
    });

    this.editableObserver.observe(this.quill.root, {
      attributes: true,
      attributeFilter: ['contenteditable'],
    });
  }

  destroyModules() {
    for (const [moduleName, module] of Object.entries(this.modules)) {
      // 调用模块的 destroy 方法(如果存在)
      if (module && typeof (module as any).destroy === 'function') {
        try {
          (module as any).destroy();
        }
        catch (error) {
          console.warn(`Failed to destroy module ${moduleName}:`, error);
        }
      }
    }
    this.modules = {};
  }

  getModule<T>(name: string) {
    return this.modules[name] as T | undefined;
  }

  quillHack() {
    const originGetSemanticHTML = this.quill.getSemanticHTML;
    this.quill.getSemanticHTML = ((index: number = 0, length?: number) => {
      const html = originGetSemanticHTML.call(this.quill, index, length);

      const tableWrapperFormat = Quill.import(`formats/${blotName.tableWrapper}`) as typeof TableWrapperFormat;
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      for (const node of Array.from(doc.querySelectorAll(`.${tableWrapperFormat.className} caption[contenteditable], .${tableWrapperFormat.className} .${TableCellFormat.className} > [contenteditable]`))) {
        node.removeAttribute('contenteditable');
      }

      return doc.body.innerHTML;
    }) as typeof originGetSemanticHTML;

    // make sure toolbar item can format selected cells
    const originFormat = this.quill.format;
    this.quill.format = function (name: string, value: unknown, source: EmitterSource = Quill.sources.API) {
      const blot = this.scroll.query(name);
      // filter embed blot
      if (!((blot as TypeParchment.BlotConstructor).prototype instanceof Parchment.EmbedBlot)) {
        const tableUpModule = this.getModule(tableUpInternal.moduleName) as TableUp;
        const range = this.getSelection(true);
        const formats = this.getFormat(range);
        // only when selection in cell and selectedTds > 1 can format all cells
        const tableSelection = tableUpModule.getModule<TableSelection>(tableUpInternal.tableSelectionName);
        if (!formats[blotName.tableCellInner] || range.length > 0 || (tableUpModule && tableSelection && tableSelection.selectedTds.length <= 1)) {
          return originFormat.call(this, name, value, source);
        }
        // format in selected cells
        if (tableUpModule && tableSelection && tableSelection.selectedTds.length > 0) {
          const selectedTds = tableSelection.selectedTds;
          // calculate the format value. the format should be canceled when this value exists in all selected cells
          let setOrigin = false;
          const tdRanges = [];
          for (const innerTd of selectedTds) {
            const index = innerTd.offset(this.scroll);
            const length = innerTd.length();
            tdRanges.push({ index, length });
            const format = this.getFormat(index, length);
            if (format[name] !== value) {
              setOrigin = true;
            }
          }
          const resultValue = setOrigin ? value : false;

          const delta = new Delta();
          for (const [i, { index, length }] of tdRanges.entries()) {
            const lastIndex = i === 0 ? 0 : tdRanges[i - 1].index + tdRanges[i - 1].length;
            delta.retain(index - lastIndex).retain(length, { [name]: resultValue });
          }

          const updateDelta = this.updateContents(delta, source);
          this.blur();
          return updateDelta;
        }
      }

      return originFormat.call(this, name, value, source);
    };

    // handle clean
    const toolbar = this.quill.theme.modules.toolbar;
    if (toolbar) {
      const cleanHandler = toolbar.handlers?.clean;
      if (cleanHandler) {
        const cleanFormatExcludeTable = (index: number, length: number, changeCellStyle: false | ((styleStr: string | undefined) => string) = () => '') => {
          // base on `removeFormat`. but not remove tableCellInner
          const text = this.quill.getText(index, length);
          const [line, offset] = this.quill.getLine(index + length);
          let suffixLength = 0;
          let suffix = new Delta();
          if (line != null) {
            suffixLength = line.length() - offset;
            suffix = line.delta().slice(offset, offset + suffixLength - 1).insert('\n');
          }
          const contents = this.quill.getContents(index, length + suffixLength);
          const diff = contents.diff(new Delta().insert(text).concat(suffix));

          let deltaIndex = 0;
          const ops = diff.ops.map((op: Op) => {
            const { attributes, ...other } = op;
            if (op.insert) {
              deltaIndex -= isString(op.insert) ? op.insert.length : 1;
            }
            else if (op.retain) {
              deltaIndex += isNumber(op.retain) ? op.retain : 1;
            }
            else if (op.delete) {
              deltaIndex += op.delete;
            }

            if (attributes) {
              const { [blotName.tableCellInner]: nullValue, ...attrs } = attributes;
              if (changeCellStyle) {
                const tableCellInner = contents.slice(deltaIndex - 1, deltaIndex).ops[0];
                if (tableCellInner?.attributes?.[blotName.tableCellInner]) {
                  const tableCellInnerValue = tableCellInner.attributes[blotName.tableCellInner] as TableCellValue;
                  const { style, ...value } = tableCellInnerValue;
                  const newStyle = changeCellStyle(style);
                  if (newStyle) {
                    return { ...other, attributes: { ...attrs, [blotName.tableCellInner]: { style: newStyle, ...value } } };
                  }
                  return { ...other, attributes: { ...attrs, [blotName.tableCellInner]: value } };
                }
              }
              return { ...other, attributes: { ...attrs } };
            }
            return op;
          });
          return new Delta(ops);
        };
        toolbar.handlers!.clean = function (this: TypeToolbar, value: unknown): void {
          const tableUpModule = this.quill.getModule(tableUpInternal.moduleName) as TableUp;
          const range = this.quill.getSelection();
          if (range && range.length > 0) {
            const formats = this.quill.getFormat(range);
            if (formats[blotName.tableCellInner]) {
              const diff = cleanFormatExcludeTable(range.index, range.length, false);
              const delta = new Delta().retain(range.index).concat(diff);
              this.quill.updateContents(delta, Quill.sources.USER);
              return;
            }
          }
          // if selection range is not in table, but use the TableSelection selected cells
          // clean all other formats in cell
          const tableSelection = tableUpModule.getModule<TableSelection>(tableUpInternal.tableSelectionName);
          if (tableUpModule && tableSelection && tableSelection.selectedTds.length > 0 && tableSelection.table) {
            const tableMain = Quill.find(tableSelection.table) as TableMainFormat;
            if (!tableMain) {
              console.warn('TableMainFormat not found');
              return;
            }
            const selectedTds = tableSelection.selectedTds;

            // get all need clean style cells. include border-right/border-bottom effect cells
            const editTds = new Set<TableCellFormat>();
            const tds: { td: TableCellFormat; cleanBorder: 'bottom' | 'right' | true }[] = [];
            for (const innerTd of selectedTds) {
              if (innerTd.parent instanceof TableCellFormat) {
                for (const td of innerTd.parent.getNearByCell('top')) {
                  if (editTds.has(td)) continue;
                  editTds.add(td);
                  tds.push({ td, cleanBorder: 'bottom' });
                }
                for (const td of innerTd.parent.getNearByCell('left')) {
                  if (editTds.has(td)) continue;
                  editTds.add(td);
                  tds.push({ td, cleanBorder: 'right' });
                }

                editTds.add(innerTd.parent);
                tds.push({ td: innerTd.parent, cleanBorder: true });
              }
            }
            // sort cells makesure index correct
            const allCells = tableMain.descendants(TableCellFormat);
            const cellIndexMap = new Map(allCells.map((cell, index) => [cell, index]));
            tds.sort((a, b) => cellIndexMap.get(a.td)! - cellIndexMap.get(b.td)!);

            // compute delta
            let delta = new Delta();
            let lastIndex = 0;
            for (const { td, cleanBorder } of tds) {
              const index = td.getCellInner().offset(this.quill.scroll);
              const length = td.getCellInner().length();
              // `line` length will include a break(\n) at the end. minus 1 to remove break
              const diff = cleanFormatExcludeTable(
                index,
                length - 1,
                (styleStr: string | undefined) => {
                  if (!styleStr || cleanBorder === true) return '';
                  // only clean border-right/border-bottom style
                  const css = cssTextToObject(styleStr);
                  const filterStyle = Object.keys(css).filter(key => !key.startsWith(toCamelCase(`border-${cleanBorder}`))).reduce((acc: Record<string, string>, key: string) => {
                    acc[key] = css[key];
                    return acc;
                  }, {});
                  return objectToCssText(filterStyle);
                },
              );
              const cellDiff = new Delta().retain(index - lastIndex).concat(diff);
              delta = delta.concat(cellDiff);
              lastIndex = index + length;
            }
            this.quill.updateContents(delta, Quill.sources.USER);
            if (selectedTds.length > 1) this.quill.blur();
            return;
          }
          return cleanHandler.call(this, value);
        };
      }
    }
  }

  async buildCustomSelect(customSelect: ((module: TableUp, picker: QuillThemePicker) => HTMLElement | Promise<HTMLElement>) | undefined, picker: QuillThemePicker) {
    if (!customSelect || !isFunction(customSelect)) return;
    const dom = document.createElement('div');
    dom.classList.add('ql-custom-select');
    this.selector = await customSelect(this, picker);
    dom.appendChild(this.selector);
    if (this.options.fullSwitch) {
      const bem = createBEM('creator');
      const isFulllLabel = document.createElement('label');
      isFulllLabel.classList.add(bem.be('checkbox'));
      const isFullCheckbox = document.createElement('input');
      isFullCheckbox.type = 'checkbox';
      isFullCheckbox.checked = this.options.full;
      isFullCheckbox.addEventListener('change', () => {
        this.options.full = isFullCheckbox.checked;
      });
      const isFullCheckboxText = document.createElement('span');
      isFullCheckboxText.textContent = this.options.texts.fullCheckboxText;
      isFulllLabel.appendChild(isFullCheckbox);
      isFulllLabel.appendChild(isFullCheckboxText);
      dom.appendChild(isFulllLabel);
    }
    picker.options.innerHTML = '';
    picker.options.appendChild(dom);
  }

  setCellAttrs(selectedTds: TableCellInnerFormat[], attr: string, value?: any, isStyle: boolean = false) {
    if (selectedTds.length === 0) return;
    for (const td of selectedTds) {
      td.setFormatValue(attr, value, isStyle);
    }
  }

  getTextByCell(tds: TableCellInnerFormat[]) {
    let text = '';
    for (const td of tds) {
      const index = td.offset(this.quill.scroll);
      const length = td.length();
      for (const op of this.quill.getContents(index, length).ops) {
        if (isString(op.insert)) {
          text += op.insert;
        }
      }
    }
    return text;
  }

  getHTMLByCell(tds: TableCellInnerFormat[], isCut = false) {
    if (tds.length === 0) return '';
    let tableMain: TableMainFormat | null = null;
    try {
      for (const td of tds) {
        const tdParentMain = findParentBlot(td, blotName.tableMain);
        if (!tableMain) {
          tableMain = tdParentMain;
        }
        if (tdParentMain !== tableMain) {
          console.error('tableMain is not same');
          return '';
        }
      }
    }
    catch {
      console.error('tds must be in same tableMain');
      return '';
    }

    if (!tableMain) return '';
    const tableIndex = this.quill.getIndex(tableMain);
    const tableLength = tableMain.length();
    const tableHTML = this.quill.getSemanticHTML(tableIndex, tableLength);
    const parser = new DOMParser();
    const doc = parser.parseFromString(tableHTML, 'text/html');

    const cols = Array.from(doc.querySelectorAll('col'));
    const colIds = cols.map(col => col.dataset.colId!);
    const cellColWidth: string[] = [];
    const cellColIds = new Set<string>();
    const cellIds = new Set<string>();
    for (const td of tds) {
      cellColIds.add(td.colId);
      const currentColId = td.colId;
      const colIndex = colIds.indexOf(currentColId);
      for (let i = 0; i < td.colspan; i++) {
        cellColIds.add(colIds[colIndex + i]);
      }
      cellIds.add(`${td.rowId}-${td.colId}`);
    }
    // filter col
    for (let index = 0; index < cols.length; index++) {
      const col = cols[index];
      if (!cellColIds.has(col.dataset.colId!)) {
        col.remove();
        cols.splice(index--, 1);
      }
      else {
        cellColWidth.push(col.getAttribute('width')!);
      }
    }
    // filter td
    let rowCount = 0;
    let lastRowId: string | null = null;
    for (const td of Array.from(doc.querySelectorAll('td, th')) as HTMLElement[]) {
      if (!cellIds.has(`${td.dataset.rowId}-${td.dataset.colId}`)) {
        const parent = td.parentElement;
        td.remove();
        if (parent && parent.children.length <= 0) {
          parent.remove();
        }
      }
      else {
        if (lastRowId !== td.dataset.rowId) {
          rowCount += 1;
          lastRowId = td.dataset.rowId!;
        }
      }
    }
    // calculate width
    const colsValue = cols.map(col => TableColFormat.value(col));
    if (tableMain.full) {
      const totalWidth = colsValue.reduce((total, col) => col.width + total, 0);
      for (const [i, col] of colsValue.entries()) {
        col.width = Math.round((col.width / totalWidth) * 100);
        cols[i].setAttribute('width', `${col.width}%`);
      }
    }
    else {
      let width = 0;
      for (const col of colsValue) {
        width += col.width;
      }
      const tableMainDom = doc.querySelector('table')!;
      tableMainDom.style.width = `${width}px`;
    }

    if (isCut) {
      const trs = tableMain.getRows();
      if (rowCount === trs.length) {
        this.removeCol(tds);
      }
      else {
        for (const td of tds) {
          td.domNode.innerHTML = '<p><br></p>';
        }
      }
    }
    return doc.body.innerHTML;
  }

  insertTable(rows: number, columns: number, source: EmitterSource = Quill.sources.API) {
    if (rows >= 30 || columns >= 30) {
      throw new Error('Both rows and columns must be less than 30.');
    }

    this.quill.focus();
    const range = this.quill.getSelection();
    if (range == null) return;
    const [currentBlot] = this.quill.getLeaf(range.index);
    if (!currentBlot) return;
    if (isForbidInTable(currentBlot)) {
      throw new Error(`Not supported ${currentBlot.statics.blotName} insert into table.`);
    }

    const tableId = randomId();
    const colIds = new Array(columns).fill(0).map(() => randomId());

    const borderWidth = this.calculateTableCellBorderWidth();
    const rootStyle = getComputedStyle(this.quill.root);
    const paddingLeft = Number.parseInt(rootStyle.paddingLeft);
    const paddingRight = Number.parseInt(rootStyle.paddingRight);
    const scrollBarWidth = this.quill.root.scrollHeight > this.quill.root.clientHeight ? getScrollBarWidth({ target: this.quill.root }) : 0;
    const width = Number.parseInt(rootStyle.width) - paddingLeft - paddingRight - borderWidth - scrollBarWidth;

    // insert delta data to create table
    const colWidth = !this.options.full ? `${Math.max(Math.floor(width / columns), tableUpSize.colMinWidthPx)}px` : `${Math.max((1 / columns) * 100, tableUpSize.colMinWidthPre)}%`;
    const delta: Record<string, any>[] = [{ retain: range.index }];
    const aroundContent = this.quill.getContents(range.index, 1);
    const [, offset] = this.quill.getLine(range.index);
    if (aroundContent.ops[0].insert !== '\n' && offset !== 0) delta.push({ insert: '\n' });

    for (let i = 0; i < columns; i++) {
      delta.push({
        insert: {
          [blotName.tableCol]: {
            width: colWidth,
            tableId,
            colId: colIds[i],
            full: this.options.full,
          },
        },
      });
    }
    for (let j = 0; j < rows; j++) {
      const rowId = randomId();
      for (let i = 0; i < columns; i++) {
        delta.push({
          insert: '\n',
          attributes: {
            [blotName.tableCellInner]: {
              tableId,
              rowId,
              colId: colIds[i],
              rowspan: 1,
              colspan: 1,
            },
          },
        });
      }
    }

    this.quill.updateContents(new Delta(delta), source);
    this.quill.setSelection(range.index + columns, Quill.sources.SILENT);
    this.quill.focus();
  }

  calculateTableCellBorderWidth() {
    const tableStr = `
      <table class="${TableMainFormat.className}">
        <tbody>
          <tr>
            <td class="${TableCellFormat.className}"></td>
          </tr>
        </tbody>
      </table>
    `;
    const div = document.createElement('div');
    div.className = TableWrapperFormat.className;
    div.innerHTML = tableStr;
    div.style.position = 'absolute';
    div.style.left = '-9999px';
    div.style.top = '-9999px';
    div.style.visibility = 'hidden';
    this.quill.root.appendChild(div);
    const tempTableStyle = window.getComputedStyle(div.querySelector('td')!);
    const borderWidth = Number.parseFloat(tempTableStyle.borderWidth) || 0;
    this.quill.root.removeChild(div);
    return borderWidth;
  }

  // handle unusual delete cell
  fixUnusuaDeletelTable(tableBlot: TableMainFormat) {
    const tableColIds = tableBlot.getColIds();
    if (tableColIds.length === 0) {
      tableBlot.remove();
      return;
    }
    const bodys = tableBlot.getBodys();
    const tableId = tableBlot.tableId;
    for (const body of bodys) {
    // calculate all cells in body
      const trBlots = body.getRows();
      if (trBlots.length === 0) {
        body.remove();
        continue;
      }
      // append by col
      const cellSpanMap = new Array(trBlots.length).fill(0).map(() => new Array(tableColIds.length).fill(false));
      for (const [indexTr, tr] of trBlots.entries()) {
        let indexTd = 0;
        let indexCol = 0;
        const curCellSpan = cellSpanMap[indexTr];
        const tds = tr.descendants(TableCellFormat);
        // loop every row and column
        while (indexCol < tableColIds.length) {
        // skip when rowspan or colspan
          if (curCellSpan[indexCol]) {
            indexCol += 1;
            continue;
          }
          const curTd = tds[indexTd];
          // if colId does not match. insert a new one
          if (!curTd || curTd.colId !== tableColIds[indexCol]) {
            tr.insertBefore(
              createCell(
                this.quill.scroll,
                {
                  tableId,
                  colId: tableColIds[indexCol],
                  rowId: tr.rowId,
                },
              ),
              curTd,
            );
          }
          else {
            if (indexTr + curTd.rowspan - 1 >= trBlots.length) {
              curTd.getCellInner().rowspan = trBlots.length - indexTr;
            }

            const { colspan, rowspan } = curTd;
            // skip next column cell
            if (colspan > 1) {
              for (let c = 1; c < colspan; c++) {
                curCellSpan[indexCol + c] = true;
              }
            }
            // skip next rowspan cell
            if (rowspan > 1) {
              for (let r = indexTr + 1; r < indexTr + rowspan; r++) {
                for (let c = 0; c < colspan; c++) {
                  cellSpanMap[r][indexCol + c] = true;
                }
              }
            }
            indexTd += 1;
          }
          indexCol += 1;
        }

        // if td not match all exist td. Indicates that a cell has been inserted
        if (indexTd < tds.length) {
          for (let i = indexTd; i < tds.length; i++) {
            tds[i].remove();
          }
        }
      }
    }
  }

  balanceTables() {
    for (const tableBlot of this.quill.scroll.descendants(TableMainFormat)) {
      tableBlot.checkEmptyCol(this.options.autoMergeCell);
      tableBlot.checkEmptyRow(this.options.autoMergeCell);
      this.fixUnusuaDeletelTable(tableBlot);
    }
  }

  listenBalanceCells() {
    this.quill.on(
      Quill.events.SCROLL_OPTIMIZE,
      (mutations: MutationRecord[]) => {
        mutations.some((mutation) => {
          // TODO: if need add ['COL', 'COLGROUP']
          if (['TD', 'TR', 'TBODY', 'TABLE'].includes((mutation.target as HTMLElement).tagName)) {
            this.fixTableByLisenter();
            return true;
          }
          return false;
        });
        for (const mutation of mutations) {
          const mutationTarget = mutation.target as HTMLElement;
          if (mutationTarget.tagName === 'TABLE') {
            const tableMain = Quill.find(mutationTarget) as TableMainFormat;
            if (tableMain) {
              tableMain.sortMergeChildren();
              break;
            }
          }
        }
      },
    );
  }

  deleteTable(selectedTds: TableCellInnerFormat[]) {
    if (selectedTds.length === 0) return;
    const tableBlot = findParentBlot(selectedTds[0], blotName.tableMain);
    tableBlot?.remove();
  }

  appendRow(selectedTds: TableCellInnerFormat[], isDown: boolean) {
    if (selectedTds.length <= 0) return;
    // find baseTd and baseTr
    const baseTd = selectedTds[isDown ? selectedTds.length - 1 : 0];
    const [tableBlot, baseTdParentTr] = findParentBlots(baseTd, [blotName.tableMain, blotName.tableRow] as const);
    const tableTrs = tableBlot.getRows();
    const i = tableTrs.indexOf(baseTdParentTr);
    const insertRowIndex = i + (isDown ? baseTd.rowspan : 0);

    tableBlot.insertRow(insertRowIndex);
  }

  appendCol(selectedTds: TableCellInnerFormat[], isRight: boolean) {
    if (selectedTds.length <= 0) return;

    // find insert column index in row
    const [baseTd] = selectedTds.reduce((pre, cur) => {
      const columnIndex = cur.getColumnIndex();
      if (!isRight && columnIndex <= pre[1]) {
        pre = [cur, columnIndex];
      }
      else if (isRight && columnIndex >= pre[1]) {
        pre = [cur, columnIndex];
      }
      return pre;
    }, [selectedTds[0], selectedTds[0].getColumnIndex()]);
    const columnIndex = baseTd.getColumnIndex() + (isRight ? baseTd.colspan : 0);

    const tableBlot = findParentBlot(baseTd, blotName.tableMain);
    const tableId = tableBlot.tableId;
    const newColId = randomId();

    const [colgroup] = tableBlot.descendants(TableColgroupFormat);
    if (colgroup) {
      colgroup.insertColByIndex(columnIndex, {
        tableId,
        colId: newColId,
        width: tableBlot.full ? 6 : 160,
        full: tableBlot.full,
      });
    }

    // loop tr and insert cell at index
    // if index is inner cell, skip next `rowspan` line
    // if there are cells both have column span and row span before index cell, minus `colspan` cell for next line
    const trs = tableBlot.getRows();
    const spanCols: number[] = [];
    let skipRowNum = 0;
    for (const tr of Object.values(trs)) {
      const spanCol = spanCols.shift() || 0;
      if (skipRowNum > 0) {
        skipRowNum -= 1;
        continue;
      }
      const nextSpanCols = tr.insertCell(columnIndex - spanCol, {
        tableId,
        rowId: tr.rowId,
        colId: newColId,
        rowspan: 1,
        colspan: 1,
      });
      if (nextSpanCols.skipRowNum) {
        skipRowNum += nextSpanCols.skipRowNum;
      }
      for (const [i, n] of nextSpanCols.entries()) {
        spanCols[i] = (spanCols[i] || 0) + n;
      }
    }
  }

  /**
   * after insert or remove cell. handle cell colspan and rowspan merge
   */
  fixTableByRemove(tableBlot: TableMainFormat) {
    if (!this.options.autoMergeCell) return;
    // calculate all cells
    // maybe will get empty tr
    const trBlots = tableBlot.getRows();
    const tableCols = tableBlot.getCols();
    const colIdMap = tableCols.reduce((idMap, col) => {
      idMap[col.colId] = 0;
      return idMap;
    }, {} as Record<string, number>);
    // merge rowspan
    const reverseTrBlots = trBlots.toReversed();
    const removeTr: number[] = [];
    for (const [index, tr] of reverseTrBlots.entries()) {
      const i = trBlots.length - index - 1;
      if (tr.children.length <= 0) {
        removeTr.push(i);
      }
      else {
        // if have td rowspan across empty tr. minus rowspan
        tr.foreachCellInner((td) => {
          const sum = removeTr.reduce((sum, val) => td.rowspan + i > val ? sum + 1 : sum, 0);
          td.rowspan -= sum;
          // count exist col
          colIdMap[td.colId] += 1;
        });
      }
    }
    // merge colspan
    let index = 0;
    for (const count of Object.values(colIdMap)) {
      if (count === 0) {
        const spanCols: number[] = [];
        let skipRowNum = 0;
        for (const tr of Object.values(trBlots)) {
          const spanCol = spanCols.shift() || 0;
          let nextSpanCols = [];
          if (skipRowNum > 0) {
            nextSpanCols = tr.getCellByColumIndex(index - spanCol)[2];
            skipRowNum -= 1;
          }
          else {
            nextSpanCols = tr.removeCell(index - spanCol);
            if (nextSpanCols.skipRowNum) {
              skipRowNum += nextSpanCols.skipRowNum;
            }
          }
          for (const [i, n] of nextSpanCols.entries()) {
            spanCols[i] = (spanCols[i] || 0) + n;
          }
        }
      }
      else {
        index += 1;
      }
    }
    // remove col
    for (const col of tableCols) {
      if (colIdMap[col.colId] === 0) {
        if (col.prev) {
          (col.prev as TableColFormat).width += col.width;
        }
        else if (col.next) {
          (col.next as TableColFormat).width += col.width;
        }
        col.remove();
      }
    }
  }

  removeRow(selectedTds: TableCellInnerFormat[]) {
    if (selectedTds.length <= 0) return;
    const baseTd = selectedTds[0];
    const tableBlot = findParentBlot(baseTd, blotName.tableMain);
    const trs = tableBlot.getRows();
    let endTrIndex = trs.length;
    let nextTrIndex = -1;
    for (const td of selectedTds) {
      const tr = findParentBlot(td, blotName.tableRow);
      const index = trs.indexOf(tr);
      if (index < endTrIndex) {
        endTrIndex = index;
      }
      if (index + td.rowspan > nextTrIndex) {
        nextTrIndex = index + td.rowspan;
      }
    }

    const patchTds: Record<string, {
      rowspan: number;
      colspan: number;
      colIndex: number;
    }> = {};
    for (let i = endTrIndex; i < Math.min(trs.length, nextTrIndex); i++) {
      const tr = trs[i];
      tr.foreachCellInner((td) => {
        // find cells in rowspan that exceed the deletion range
        if (td.rowspan + i > nextTrIndex) {
          patchTds[td.colId] = {
            rowspan: td.rowspan + i - nextTrIndex,
            colspan: td.colspan,
            colIndex: td.getColumnIndex(),
          };
        }
        // only remove td. empty tr to calculate colspan and rowspan
        td.parent.remove();
      });
      if (tr.length() === 0) tr.remove();
    }

    if (trs[nextTrIndex]) {
      const nextTr = trs[nextTrIndex];
      const tableId = tableBlot.tableId;
      // insert cell in nextTr to patch exceed cell
      for (const [colId, { colIndex, colspan, rowspan }] of Object.entries(patchTds)) {
        nextTr.insertCell(colIndex, {
          tableId,
          rowId: nextTr.rowId,
          colId,
          colspan,
          rowspan,
        });
      }
    }

    this.fixTableByRemove(tableBlot);
  }

  removeCol(selectedTds: TableCellInnerFormat[]) {
    if (selectedTds.length <= 0) return;
    const baseTd = selectedTds[0];
    const tableBlot = findParentBlot(baseTd, blotName.tableMain);
    const colspanMap: Record<string, number> = {};
    for (const td of selectedTds) {
      if (!colspanMap[td.rowId]) colspanMap[td.rowId] = 0;
      colspanMap[td.rowId] += td.colspan;
    }
    const colspanCount = Math.max(...Object.values(colspanMap));
    const columnIndex = baseTd.getColumnIndex();

    const trs = tableBlot.descendants(TableRowFormat);
    for (let i = 0; i < colspanCount; i++) {
      const spanCols: number[] = [];
      let skipRowNum = 0;
      for (const tr of Object.values(trs)) {
        const spanCol = spanCols.shift() || 0;
        if (skipRowNum > 0) {
          skipRowNum -= 1;
          continue;
        }
        const nextSpanCols = tr.removeCell(columnIndex - spanCol);
        if (nextSpanCols.skipRowNum) {
          skipRowNum += nextSpanCols.skipRowNum;
        }
        for (const [i, n] of nextSpanCols.entries()) {
          spanCols[i] = (spanCols[i] || 0) + n;
        }
      }
    }
    // delete col need after remove cell. remove cell need all column id
    // manual delete col. use fixTableByRemove to delete col will delete extra cells
    const [colgroup] = tableBlot.descendants(TableColgroupFormat);
    if (colgroup) {
      for (let i = 0; i < colspanCount; i++) {
        colgroup.removeColByIndex(columnIndex);
      }
    }

    this.fixTableByRemove(tableBlot);
  }

  mergeCells(selectedTds: TableCellInnerFormat[]) {
    if (selectedTds.length <= 1) return;
    const baseCell = selectedTds[0];
    // move selected cells in same table body
    const baseCellBody = baseCell.getTableBody();
    // insert base row
    let baseRow = baseCell.getTableRow();
    if (!baseCellBody || !baseRow) return;
    for (let i = 1; i < selectedTds.length; i++) {
      const selectTd = selectedTds[i];
      const currentTdBody = selectTd.getTableBody();
      if (currentTdBody && currentTdBody !== baseCellBody) {
        const currentRow = selectTd.getTableRow();
        if (currentRow) {
          baseRow.parent.insertBefore(currentRow, baseRow.next);
          baseRow = currentRow;
        }
      }
    }
    baseCellBody.convertBody(baseCell.wrapTag);

    const counts = selectedTds.reduce(
      (pre, selectTd, index) => {
        // count column span
        const colId = selectTd.colId;
        if (!pre[0][colId]) pre[0][colId] = 0;
        pre[0][colId] += selectTd.rowspan;
        // count row span
        const rowId = selectTd.rowId;
        if (!pre[1][rowId]) pre[1][rowId] = 0;
        pre[1][rowId] += selectTd.colspan;
        // merge select cell
        if (index !== 0) {
          // remove empty \n
          if (selectTd.length() > 1) {
            selectTd.moveChildren(pre[2]);
          }
          selectTd.parent.remove();
        }
        return pre;
      },
      [{} as Record<string, number>, {} as Record<string, number>, baseCell] as const,
    );

    const rowCount = Math.max(...Object.values(counts[0]));
    const colCount = Math.max(...Object.values(counts[1]));
    const baseTd = counts[2];
    baseTd.colspan = colCount;
    baseTd.rowspan = rowCount;

    // selection will move with cursor. make sure selection is in baseTd
    const index = this.quill.getIndex(baseTd);
    this.quill.setSelection({ index, length: 0 }, Quill.sources.SILENT);

    const tableBlot = findParentBlot(baseTd, blotName.tableMain);
    this.fixTableByRemove(tableBlot);
  }

  splitCell(selectedTds: TableCellInnerFormat[]) {
    if (selectedTds.length !== 1) return;
    const baseCell = selectedTds[0];
    if (baseCell.colspan === 1 && baseCell.rowspan === 1) return;
    const [tableBlot, baseTr] = findParentBlots(baseCell, [blotName.tableMain, blotName.tableRow] as const);
    const rows = tableBlot.getRows();
    const tableId = tableBlot.tableId;
    const colIndex = baseCell.getColumnIndex();
    const colIds = tableBlot.getColIds().slice(colIndex, colIndex + baseCell.colspan).toReversed();
    const baseCellValue = baseCell.formats()[blotName.tableCellInner] as TableCellValue;
    const { emptyRow, ...extendsBaseCellValue } = baseCellValue;

    let rowIndex = rows.indexOf(baseTr);
    if (rowIndex === -1) return;
    let curTr = rows[rowIndex];
    let rowspan = baseCell.rowspan;
    // reset span first. insertCell need colspan to judge insert position
    baseCell.colspan = 1;
    baseCell.rowspan = 1;
    while (curTr && rowspan > 0) {
      for (const id of colIds) {
        // keep baseCell. baseTr should insert at baseCell's column index + 1
        if (curTr === baseTr && id === baseCell.colId) continue;
        curTr.insertCell(
          colIndex + (curTr === baseTr ? 1 : 0),
          {
            ...extendsBaseCellValue,
            tableId,
            rowId: curTr.rowId,
            colId: id,
            rowspan: 1,
            colspan: 1,
          },
        );
      }

      rowspan -= 1;
      rowIndex += 1;
      curTr = rows[rowIndex];
    }
  }

  convertTableBodyByCells(tableBlot: TableMainFormat, selecteds: TableCellInnerFormat[], tag: TableBodyTag) {
    let firstRowIndex: number | undefined;
    let lastRowIndex: number | undefined;
    const rows = tableBlot.getRows();
    for (const cell of selecteds) {
      const row = cell.getTableRow();
      if (!row) continue;
      const index = rows.indexOf(row);
      if (isUndefined(firstRowIndex)) {
        firstRowIndex = index;
      }
      if (isUndefined(lastRowIndex)) {
        lastRowIndex = index;
      }

      if (index < firstRowIndex) {
        lastRowIndex = firstRowIndex;
        firstRowIndex = index;
      }
      else if (index > lastRowIndex) {
        lastRowIndex = index;
      }
    }
    if (isUndefined(firstRowIndex) || isUndefined(lastRowIndex)) {
      console.warn('TableRow not found');
      return;
    }
    const firstRow = rows[firstRowIndex];
    const lastRow = rows[lastRowIndex];
    tableBlot.split(lastRow.offset(tableBlot) + lastRow.length());
    const currentTable = tableBlot.split(firstRow.offset(tableBlot)) as TableMainFormat;
    // selecteds may in different bodys
    // create a new body, insert to current table, move all rows to new body, then call new body's convertBody
    const currentTableRows = currentTable.getRows();
    const [firstBody] = currentTable.getBodys();
    const newBody = firstBody.clone() as TableBodyFormat;
    currentTable.appendChild(newBody);
    for (const row of currentTableRows) {
      // only move the not empty row. the empty row will regenerate when `optimize`
      if (row.length() > 0) {
        newBody.appendChild(row);
      }
    }
    newBody.convertBody(tag);
    firstBody.remove();
  }
}

import type { TableColFormat, TableMainFormat, TableRowFormat, TableWrapperFormat } from '../../formats';
import type { TableUp } from '../../table-up';
import type { TableResizeScaleOptions } from '../../utils';
import Quill from 'quill';
import { getTableMainRect } from '../../formats';
import { addScrollEvent, clearScrollEvent, createBEM, dragElement, tableUpSize } from '../../utils';
import { TableDomSelector } from '../table-dom-selector';
import { isTableAlignRight } from './utils';

export class TableResizeScale extends TableDomSelector {
  static moduleName = 'table-resize-scale';

  scrollHandler: [HTMLElement, (e: Event) => void][] = [];
  tableMainBlot?: TableMainFormat;
  tableWrapperBlot?: TableWrapperFormat;
  bem = createBEM('scale');
  options: TableResizeScaleOptions;
  root?: HTMLElement;
  block?: HTMLElement;
  resizeobserver: ResizeObserver = new ResizeObserver(() => this.update());
  constructor(public tableModule: TableUp, public quill: Quill, options: Partial<TableResizeScaleOptions>) {
    super(tableModule, quill);
    this.options = this.resolveOptions(options);

    this.quill.on(Quill.events.EDITOR_CHANGE, this.updateWhenTextChange);
  }

  updateWhenTextChange = (eventName: string) => {
    if (eventName === Quill.events.TEXT_CHANGE) {
      if (this.table && !this.quill.root.contains(this.table)) {
        this.setSelectionTable(undefined);
      }
      else {
        this.update();
      }
    }
  };

  resolveOptions(options: Partial<TableResizeScaleOptions>) {
    return Object.assign({
      blockSize: 12,
      offset: 6,
    }, options);
  }

  buildResizer() {
    if (!this.tableMainBlot || !this.tableWrapperBlot) return;
    this.root = this.tableModule.addContainer(this.bem.b());
    this.block = document.createElement('div');
    this.block.classList.add(this.bem.be('block'));
    Object.assign(this.block.style, {
      width: `${this.options.blockSize}px`,
      height: `${this.options.blockSize}px`,
    });
    this.root.appendChild(this.block);

    let originColWidth: { blot: TableColFormat; width: number }[] = [];
    let originRowHeight: { blot: TableRowFormat; height: number }[] = [];

    dragElement(this.block, {
      onStart: () => {
        if (!this.tableMainBlot) return;
        // save the origin width and height to calculate result width and height
        originColWidth = this.tableMainBlot.getCols().map(col => ({ blot: col, width: Math.floor(col.width) }));
        originRowHeight = this.tableMainBlot.getRows().map(row => ({ blot: row, height: Math.floor(row.domNode.getBoundingClientRect().height) }));
      },
      onMove: ({ movePosition }) => {
        if (!this.tableMainBlot) return;
        // divide equally by col count/row count
        const isRight = isTableAlignRight(this.tableMainBlot) ? -1 : 1;
        const diffX = movePosition.x * isRight;
        const diffY = movePosition.y;
        const itemWidth = Math.floor(diffX / originColWidth.length);
        const itemHeight = Math.floor(diffY / originRowHeight.length);

        for (const { blot, width } of originColWidth) {
          blot.width = Math.max(width + itemWidth, tableUpSize.colMinWidthPx);
        }
        for (const { blot, height } of originRowHeight) {
          blot.setHeight(`${Math.max(height + itemHeight, tableUpSize.rowMinHeightPx)}px`);
        }
      },
      onEnd: () => {
        originColWidth = [];
        originRowHeight = [];
      },
    });
    this.block.addEventListener('dragstart', e => e.preventDefault());
  }

  update() {
    if (!this.block || !this.root || !this.tableMainBlot || !this.tableWrapperBlot) return;
    if (this.tableMainBlot.full) {
      this.hide();
      return;
    }
    const { rect: tableRect } = getTableMainRect(this.tableMainBlot);
    if (!tableRect) return;
    const tableWrapperRect = this.tableWrapperBlot.domNode.getBoundingClientRect();
    const editorRect = this.quill.root.getBoundingClientRect();
    const { scrollTop, scrollLeft } = this.tableWrapperBlot.domNode;
    const blockSize = this.options.blockSize * 2 + this.options.offset;
    const rootWidth = Math.min(tableRect.width, tableWrapperRect.width) + blockSize;
    const rootHeight = Math.min(tableRect.height, tableWrapperRect.height) + blockSize;
    Object.assign(this.root.style, {
      width: `${rootWidth}px`,
      height: `${rootHeight}px`,
      left: `${Math.max(tableRect.x, tableWrapperRect.x) - editorRect.x - this.options.blockSize}px`,
      top: `${Math.max(tableRect.y, tableWrapperRect.y) - editorRect.y - this.options.blockSize}px`,
    });
    const blockStyle = {
      left: `${tableRect.width + blockSize - scrollLeft}px`,
      top: `${rootHeight - scrollTop}px`,
    };
    if (isTableAlignRight(this.tableMainBlot)) {
      this.root.classList.add(this.bem.is('align-right'));
      blockStyle.left = `${this.options.blockSize + -1 * scrollLeft}px`;
    }
    else {
      this.root.classList.remove(this.bem.is('align-right'));
    }
    Object.assign(this.block.style, blockStyle);
  }

  show() {
    if (!this.table) return;
    this.tableMainBlot = Quill.find(this.table) as TableMainFormat;
    if (this.tableMainBlot && !this.tableMainBlot.full) {
      this.tableWrapperBlot = this.tableMainBlot.parent as TableWrapperFormat;

      this.resizeobserver.observe(this.tableMainBlot.domNode);
      addScrollEvent.call(this, this.quill.root, () => this.update());
      addScrollEvent.call(this, this.tableWrapperBlot.domNode, () => this.update());
    }
    this.buildResizer();
  }

  hide() {
    this.tableMainBlot = undefined;
    this.tableWrapperBlot = undefined;
    if (this.root) {
      this.root.remove();
      this.root = undefined;
      this.block = undefined;
    }
    clearScrollEvent.call(this);
  }

  destroy() {
    super.destroy();
    this.hide();
    this.quill.off(Quill.events.TEXT_CHANGE, this.updateWhenTextChange);
    this.resizeobserver.disconnect();
  }
}

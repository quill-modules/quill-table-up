import type { TableMainFormat, TableWrapperFormat } from '../../formats';
import type { TableUp } from '../../table-up';
import type { DragElementOptions, Position, TableResizeBoxOptions } from '../../utils';
import type { TableSelection } from '../table-selection';
import Quill from 'quill';
import { getTableMainRect, TableCaptionFormat, TableCellInnerFormat } from '../../formats';
import { addScrollEvent, clearScrollEvent, createBEM, createResizeObserver, dragElement, findChildBlot, removeScrollEvent, tableUpEvent, tableUpInternal } from '../../utils';
import { TableResizeCommon } from './table-resize-common';
import { DragTableHelper, TableAutoScroller } from './table-resize-drag';
import { isCellsSpan, isTableAlignRight } from './utils';

export class TableResizeBox extends TableResizeCommon {
  static moduleName = 'table-resize-box';

  options: TableResizeBoxOptions;
  root: HTMLElement;
  tableWrapperBlot?: TableWrapperFormat;
  resizeObserver?: ResizeObserver;
  rowHeadWrapper: HTMLElement | null = null;
  colHeadWrapper: HTMLElement | null = null;
  corner: HTMLElement | null = null;
  scrollHandler: [HTMLElement, (e: Event) => void][] = [];
  lastHeaderSelect: { isX: boolean; index: number } | null = null;
  bem = createBEM('resize-box');
  draggingColIndex = -1;
  draggingRowIndex = -1;
  stopColDrag: (() => void)[] = [];
  stopRowDrag: (() => void)[] = [];
  dragWrapper: HTMLElement | null = null;
  dragPlaceholder: HTMLElement | null = null;
  markIndicator: HTMLElement | null = null;
  dragTip: HTMLElement | null = null;
  stopColMoveDrag: (() => void)[] = [];
  stopRowMoveDrag: (() => void)[] = [];
  autoScroller: TableAutoScroller | null = null;
  updateContentDraggingPosition: () => void;
  cellSpanIndex: Set<number> = new Set();
  dragPlaceholderStartPosition = { x: 0, y: 0 };

  constructor(public tableModule: TableUp, public quill: Quill, options: Partial<TableResizeBoxOptions>) {
    super(tableModule, quill);
    this.options = this.resolveOptions(options);

    this.updateContentDraggingPosition = () => this.updateContentDraggerPosition(null as any);
    this.root = this.tableModule.addContainer(this.bem.b());
    this.quill.on(Quill.events.EDITOR_CHANGE, this.updateWhenTextChange);
    this.quill.on(tableUpEvent.TABLE_SELECTION_CHANGE, this.updateWrapperHead);
  }

  resolveOptions(options: Partial<TableResizeBoxOptions>) {
    return Object.assign({
      size: 16,
      draggable: true,
    }, options);
  }

  updateWrapperHead = () => {
    if (!this.options.draggable) return;
    const tableSelection = this.tableModule.getModule<TableSelection>(tableUpInternal.tableSelectionName);
    if (!tableSelection || !this.tableBlot) return;
    const { isSpan: isSpanX, cellIndex: cellXIndex } = isCellsSpan(true, this.tableBlot, tableSelection.selectedTds);
    const { isSpan: isSpanY, cellIndex: cellYIndex } = isCellsSpan(false, this.tableBlot, tableSelection.selectedTds);
    // add cursor drag style
    // but if select all table, style will not be added
    if (isSpanX) {
      const tableColHeads = Array.from(this.root.getElementsByClassName(this.bem.be('col-header'))) as HTMLElement[];
      for (const el of tableColHeads) el.classList.remove(this.bem.is('selected'));
      if (!isSpanY) {
        for (const i of Array.from(cellXIndex).slice(0, -1)) {
          tableColHeads[i].classList.add(this.bem.is('selected'));
        }
      }
    }
    if (isSpanY) {
      const tableRowHeads = Array.from(this.root.getElementsByClassName(this.bem.be('row-header'))) as HTMLElement[];
      const tableRowHeadsSorted: HTMLElement[] = [];
      for (const el of tableRowHeads) {
        el.classList.remove(this.bem.is('selected'));
        tableRowHeadsSorted[Number(el.dataset.index)] = el;
      }
      if (!isSpanX) {
        for (const i of Array.from(cellYIndex).slice(0, -1)) {
          if (tableRowHeadsSorted[i]) {
            tableRowHeadsSorted[i].classList.add(this.bem.is('selected'));
          }
        }
      }
    }
  };

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

  setSelectionTable(table: HTMLTableElement | undefined) {
    if (this.table === table) return;
    this.hide();
    this.table = table;
    if (this.table) {
      const newTableBlot = Quill.find(this.table) as TableMainFormat;
      if (newTableBlot) {
        this.tableBlot = newTableBlot;
        this.tableWrapperBlot = this.tableBlot.parent as TableWrapperFormat;
      }
      this.show();
    }
    this.update();
  }

  handleResizerHeaderClick(isX: boolean, index: number, e: MouseEvent) {
    if (!this.table) return;
    const { clientX, clientY } = e;
    const tableRect = this.table.getBoundingClientRect();
    if (!e.shiftKey) {
      this.lastHeaderSelect = null;
    }
    const currentBoundary: [Position, Position] = [
      { x: isX ? tableRect.left : clientX, y: isX ? clientY : tableRect.top },
      { x: isX ? tableRect.right : clientX, y: isX ? clientY : tableRect.bottom },
    ];
    if (this.lastHeaderSelect) {
      // find last click head
      let lastX: number;
      let lastY: number;
      if (this.lastHeaderSelect.isX) {
        const tableRowHeads = Array.from(this.root.getElementsByClassName(this.bem.be('row-header'))) as HTMLElement[];
        const rect = tableRowHeads[this.lastHeaderSelect.index].getBoundingClientRect();
        lastX = Math.min(rect.left, tableRect.left);
        lastY = rect.top + rect.height / 2;
      }
      else {
        const tableColHeads = Array.from(this.root.getElementsByClassName(this.bem.be('col-header'))) as HTMLElement[];
        const rect = tableColHeads[this.lastHeaderSelect.index].getBoundingClientRect();
        lastX = rect.left + rect.width / 2;
        lastY = Math.min(rect.top, tableRect.top);
      }

      if (this.lastHeaderSelect.isX !== isX) {
        currentBoundary[1] = {
          x: Math.max(currentBoundary[0].x, lastX),
          y: Math.max(currentBoundary[0].y, lastY),
        };
        currentBoundary[0] = {
          x: Math.min(currentBoundary[0].x, lastX),
          y: Math.min(currentBoundary[0].y, lastY),
        };
      }
      else if (isX) {
        currentBoundary[0].y = Math.min(currentBoundary[0].y, lastY);
        currentBoundary[1].y = Math.max(currentBoundary[1].y, lastY);
      }
      else {
        currentBoundary[0].x = Math.min(currentBoundary[0].x, lastX);
        currentBoundary[1].x = Math.max(currentBoundary[1].x, lastX);
      }
    }
    else {
      this.lastHeaderSelect = { isX, index };
    }

    const tableSelection = this.tableModule.getModule<TableSelection>(tableUpInternal.tableSelectionName);
    if (tableSelection) {
      tableSelection.table = this.table;
      tableSelection.setSelectedTds(tableSelection.computeSelectedTds(...currentBoundary));
      tableSelection.show();
    }
  }

  findDragColIndex() {
    return this.draggingColIndex;
  }

  findDragRowIndex() {
    return this.draggingRowIndex;
  }

  updateContentDraggerPosition(dragHelper: DragTableHelper) {
    if (!dragHelper || !this.dragWrapper || !this.markIndicator || !this.tableBlot || !this.tableWrapperBlot) return;
    const { rect: tableRect } = getTableMainRect(this.tableBlot);
    if (!tableRect || dragHelper.moveToIndex < 0) return;
    const tableWrapperRect = this.tableWrapperBlot.domNode.getBoundingClientRect();
    const rootRect = this.quill.root.getBoundingClientRect();
    Object.assign(this.dragWrapper.style, {
      top: `${Math.max(tableRect.y, tableWrapperRect.y) - rootRect.y}px`,
      left: `${Math.max(tableRect.x, tableWrapperRect.x) - rootRect.x}px`,
    });

    const { position } = dragHelper.startPosition[dragHelper.moveToIndex] || {};
    const offsetX = this.dragXCommon.getOffsetFromStart(this.tableBlot);
    const offsetY = this.dragYCommon.getOffsetFromStart(this.tableBlot);
    const markIndicatorStyle = dragHelper.isDragX
      ? {
          top: `${Math.max(tableRect.y, tableWrapperRect.y) - rootRect.y}px`,
          left: `${position - rootRect.left + offsetX}px`,
        }
      : {
          top: `${position - rootRect.top + offsetY}px`,
          left: `${Math.max(tableRect.x, tableWrapperRect.x) - rootRect.x}px`,
        };
    Object.assign(this.markIndicator.style, markIndicatorStyle);
  }

  createContentDragger(e: PointerEvent, isX: boolean, dragHelper: DragTableHelper) {
    if (!this.tableBlot) return;
    const tableSelection = this.tableModule.getModule<TableSelection>(tableUpInternal.tableSelectionName);
    if (!tableSelection || !this.tableWrapperBlot) return;
    tableSelection.updateWithSelectedTds();
    const placeholderWidth = tableSelection.boundary!.width;
    const placeholderHeight = tableSelection.boundary!.height;

    const rootRect = this.quill.root.getBoundingClientRect();
    const tableWrapperRect = this.tableWrapperBlot.domNode.getBoundingClientRect();
    const dragBEM = createBEM('drag');
    this.dragWrapper = this.tableModule.addContainer(dragBEM.b());
    const wrapLeft = tableWrapperRect.x - rootRect.x;
    const wrapTop = tableWrapperRect.y - rootRect.y;
    Object.assign(this.dragWrapper.style, {
      left: `${wrapLeft}px`,
      top: `${wrapTop}px`,
      width: `${tableWrapperRect.width}px`,
      height: `${tableWrapperRect.height}px`,
    });

    this.dragPlaceholder = document.createElement('div');
    this.dragPlaceholder.classList.add(dragBEM.be('placeholder'), dragBEM.is('hidden'));
    this.dragWrapper.appendChild(this.dragPlaceholder);
    this.dragPlaceholderStartPosition = {
      x: isX ? tableSelection.boundary!.x - wrapLeft : 0,
      y: isX ? 0 : tableSelection.boundary!.y - wrapTop,
    };
    Object.assign(this.dragPlaceholder.style, {
      left: `${this.dragPlaceholderStartPosition.x}px`,
      top: `${this.dragPlaceholderStartPosition.y}px`,
      width: `${placeholderWidth}px`,
      height: `${placeholderHeight}px`,
    });

    this.markIndicator = this.tableModule.addContainer(dragBEM.be('indicator'));
    const markIndicatorStyle = isX
      ? {
          top: `${wrapTop}px`,
          height: `${Math.min(tableSelection.boundary!.height, tableWrapperRect.height)}px`,
        }
      : {
          left: `${wrapLeft}px`,
          width: `${Math.min(tableSelection.boundary!.width, tableWrapperRect.width)}px`,
        };
    Object.assign(this.markIndicator.style, markIndicatorStyle);
    this.updateContentDraggingPosition = () => this.updateContentDraggerPosition(dragHelper);
    addScrollEvent.call(this, this.quill.root, this.updateContentDraggingPosition);
    addScrollEvent.call(this, this.tableWrapperBlot.domNode, this.updateContentDraggingPosition);

    this.dragTip = this.tableModule.addContainer(dragBEM.be('tip'));
    const dragTipContent = document.createElement('div');
    dragTipContent.classList.add(dragBEM.be('tip-content'));
    this.dragTip.appendChild(dragTipContent);

    // absolute position. range in tableWrapper viewport
    if (isX) {
      this.dragXCommon.minRange = 0;
      this.dragXCommon.maxRange = tableWrapperRect.width - placeholderWidth;
    }
    else {
      this.dragYCommon.minRange = 0;
      this.dragYCommon.maxRange = tableWrapperRect.height - placeholderHeight;
    }
  }

  bindColEvents() {
    if (!this.tableWrapperBlot) return;
    const tableColHeads = Array.from(this.root.getElementsByClassName(this.bem.be('col-header'))) as HTMLElement[];
    const tableColHeadSeparators = Array.from(this.root.getElementsByClassName(this.bem.be('col-separator'))) as HTMLElement[];

    addScrollEvent.call(this, this.tableWrapperBlot.domNode, () => {
      this.colHeadWrapper!.scrollLeft = this.tableWrapperBlot!.domNode.scrollLeft;
    });

    if (this.stopColMoveDrag.length > 0) {
      for (const stop of this.stopColMoveDrag) stop();
      this.stopColMoveDrag = [];
    }
    const dragHelper = new DragTableHelper(this.tableModule, this.tableBlot!, this.dragXCommon, {
      isDragX: true,
      allowMoveToIndex: index => this.allowMoveToIndex(index),
    });
    for (const [index, el] of tableColHeads.entries()) {
      el.addEventListener('click', this.handleResizerHeaderClick.bind(this, false, index));
      if (this.options.draggable) {
        const { stop } = dragElement(el, this.dragHeadOptions(true, { index, dragHelper }));
        this.stopColMoveDrag.push(stop);
      }
    }

    if (this.stopColDrag.length > 0) {
      for (const stop of this.stopColDrag) stop();
      this.stopColDrag = [];
    }
    for (const [i, el] of tableColHeadSeparators.entries()) {
      const { stop } = dragElement(el, {
        axis: 'x',
        onStart: (position, e) => {
          this.dragging = true;

          this.draggingColIndex = i;
          this.calculateColDragRange();
          this.dragXCommon.createBreak();
          if (!this.tableBlot) return;
          const tableWrapperRect = this.tableBlot.domNode.parentElement!.getBoundingClientRect();
          const { rect: tableRect } = getTableMainRect(this.tableBlot);
          if (!tableRect) return;
          // record current tablb rect to calculate the offset if have scroll when dragging
          this.dragXCommon.startValue = tableRect.x;
          const rootRect = this.quill.root.getBoundingClientRect();
          Object.assign(this.dragXCommon.dragBreak!.style, {
            top: `${Math.max(tableWrapperRect.y, tableRect.y) - rootRect.y}px`,
            left: `${e.clientX - rootRect.x}px`,
            height: `${Math.min(tableWrapperRect.height, tableRect.height)}px`,
          });
        },
        onMove: ({ position }) => {
          if (!this.dragXCommon.dragBreak) return;
          const resultX = this.dragXCommon.limitRange(this.tableBlot, position.x, true);
          const rootRect = this.quill.root.getBoundingClientRect();
          this.dragXCommon.dragBreak.style.left = `${resultX - rootRect.x}px`;
        },
        onEnd: ({ position }) => {
          this.dragging = false;

          this.updateTableCol(position.x);
          this.removeBreak();
        },
      });
      this.stopColDrag.push(stop);

      el.addEventListener('dragstart', e => e.preventDefault());
    }
  }

  bindRowEvents() {
    const tableRowHeads = Array.from(this.root.getElementsByClassName(this.bem.be('row-header'))) as HTMLElement[];
    const tableRowHeadSeparators = Array.from(this.root.getElementsByClassName(this.bem.be('row-separator'))) as HTMLElement[];

    addScrollEvent.call(this, this.tableWrapperBlot!.domNode, () => {
      this.rowHeadWrapper!.scrollTop = this.tableWrapperBlot!.domNode.scrollTop;
    });

    if (this.stopRowMoveDrag.length > 0) {
      for (const stop of this.stopRowMoveDrag) stop();
      this.stopRowMoveDrag = [];
    }
    const dragHelper = new DragTableHelper(this.tableModule, this.tableBlot!, this.dragYCommon, {
      isDragX: false,
      allowMoveToIndex: index => this.allowMoveToIndex(index),
    });
    for (const [i, el] of tableRowHeads.entries()) {
      // emptyRow doesn't generate head. logic need row index, not head inedx
      const index = Number(el.dataset.index || i);
      el.addEventListener('click', this.handleResizerHeaderClick.bind(this, true, i));
      if (this.options.draggable) {
        const { stop } = dragElement(el, this.dragHeadOptions(false, { index, dragHelper }));
        this.stopRowMoveDrag.push(stop);
      }
    }

    if (this.stopRowDrag.length > 0) {
      for (const stop of this.stopRowDrag) stop();
      this.stopRowDrag = [];
    }
    for (const [i, el] of tableRowHeadSeparators.entries()) {
      const { stop } = dragElement(el, {
        axis: 'y',
        onStart: (ops, e) => {
          this.dragging = true;

          this.draggingRowIndex = i;
          this.calculateRowDragRange();
          this.dragYCommon.createBreak();
          if (!this.tableBlot) return;
          const tableWrapperRect = this.tableBlot.domNode.parentElement!.getBoundingClientRect();
          const { rect: tableRect } = getTableMainRect(this.tableBlot);
          if (!tableRect) return;
          // record current tablb rect to calculate the offset if have scroll when dragging
          this.dragYCommon.startValue = tableRect.y;
          const rootRect = this.quill.root.getBoundingClientRect();
          Object.assign(this.dragYCommon.dragBreak!.style, {
            top: `${e.clientY - rootRect.y}px`,
            left: `${Math.max(tableWrapperRect.x, tableRect.x) - rootRect.x}px`,
            width: `${Math.min(tableWrapperRect.width, tableRect.width)}px`,
          });
        },
        onMove: ({ position }) => {
          if (!this.dragYCommon.dragBreak || !this.table) return;
          const resultY = this.dragYCommon.limitRange(this.tableBlot, position.y, true);
          const rootRect = this.quill.root.getBoundingClientRect();
          this.dragYCommon.dragBreak.style.top = `${resultY - rootRect.y}px`;
        },
        onEnd: ({ position }) => {
          this.dragging = false;

          this.updateTableRow(position.y);
          this.removeBreak();
        },
      });
      this.stopRowDrag.push(stop);

      el.addEventListener('dragstart', e => e.preventDefault());
    }
  }

  allowMoveToIndex(index: number) {
    return !this.cellSpanIndex.has(index);
  }

  recordCellSpan(isX: boolean) {
    // record colspan or rowspan cell index when dragging content
    // drag content not allow to insert on these index
    const cellIndex = new Set<number>();
    if (!this.tableBlot) return cellIndex;
    const cells = this.tableBlot.descendants(TableCellInnerFormat);
    const ids: string[] = isX ? this.tableBlot.getColIds() : this.tableBlot.getRowIds();
    const spanAttr = isX ? 'colspan' : 'rowspan';
    for (const cell of cells) {
      if (cell[spanAttr] <= 1) continue;
      const index = ids.indexOf(isX ? cell.colId : cell.rowId);
      if (index === -1) continue;
      for (let i = index + 1; i < index + cell[spanAttr] && i < ids.length; i++) {
        cellIndex.add(i);
      }
    }
    return cellIndex;
  }

  dragHeadOptions(isX: boolean, context: { index: number; dragHelper: DragTableHelper }): Partial<DragElementOptions> {
    const { dragHelper, index } = context;
    return {
      axis: isX ? 'x' : 'y',
      onStart: (positionInfo, e) => {
        let prevent = false;
        dragHelper.onStart(positionInfo, e, () => {
          if (!this.tableBlot) return;
          const count = (isX ? this.tableBlot.getCols() : this.tableBlot.getRows()).length;
          if (dragHelper.selectedIndex.size > count) {
            prevent = false;
            return;
          }
          const selectedIndex = new Set(Array.from(dragHelper.selectedIndex).slice(0, -1));
          prevent = selectedIndex.has(index);
          if (!selectedIndex.has(index)) {
            prevent = false;
            return;
          }
          this.dragging = true;
          if (isX) {
            this.draggingColIndex = index;
          }
          else {
            this.draggingRowIndex = index;
          }
          this.createContentDragger(e, isX, dragHelper);
          this.cellSpanIndex = this.recordCellSpan(isX);
          if (!this.tableWrapperBlot) return;
          this.autoScroller = new TableAutoScroller(50, 40);
          this.autoScroller.minusY = this.options.size;
          this.autoScroller.minusX = this.options.size;
          this.autoScroller.updateMousePosition(e.clientX, e.clientY);
          this.autoScroller.start(this.tableWrapperBlot.domNode);
        });
        return prevent;
      },
      onMove: (positionInfo, e) => {
        dragHelper.onMove(positionInfo, e, (helper) => {
          const { movePosition } = positionInfo;
          this.autoScroller?.updateMousePosition(e.clientX, e.clientY);
          if (!this.dragPlaceholder || !this.markIndicator || !this.dragTip || !this.tableWrapperBlot) return;

          this.dragPlaceholder.classList.remove(this.bem.is('hidden'));
          const resultPosition = helper.dragCommon.limitRange(
            this.tableBlot,
            this.dragPlaceholderStartPosition[isX ? 'x' : 'y'] + movePosition[isX ? 'x' : 'y'],
            false,
          );
          this.dragPlaceholder.style[isX ? 'left' : 'top'] = `${resultPosition}px`;
          Object.assign(this.dragTip.style, {
            left: `${e.clientX - 10}px`,
            top: `${e.clientY - 10}px`,
          });
          if (helper.moveToIndex < 0) {
            Object.assign(this.markIndicator.style, {
              opacity: '0',
            });
            return;
          }
          const rootRect = this.quill.root.getBoundingClientRect();
          const isBeyond = helper.moveToIndex >= helper.startPosition.length;
          const item = helper.startPosition[isBeyond ? helper.moveToIndex - 1 : helper.moveToIndex];
          const indicatorPosition = item.position + (isBeyond ? item.size : 0);
          const offset = helper.dragCommon.getOffsetFromStart(this.tableBlot);
          Object.assign(this.markIndicator.style, {
            opacity: '1',
            [isX ? 'left' : 'top']: `${indicatorPosition - (isX ? rootRect.left : rootRect.top) + offset}px`,
          });
        });
      },
      onEnd: (positionInfo, e) => {
        dragHelper.onEnd(positionInfo, e, (helper) => {
          const changeDelta = helper.updateTableStructure(
            this.quill.getContents(),
            (isX ? this.draggingColIndex : this.draggingRowIndex) > helper.moveToIndex,
          );
          this.quill.updateContents(changeDelta);
          this.dragging = false;
          this.cellSpanIndex = new Set();
          this.autoScroller?.stop();
          removeScrollEvent.call(this, this.quill.root, this.updateContentDraggingPosition);
          removeScrollEvent.call(this, this.tableWrapperBlot!.domNode, this.updateContentDraggingPosition);
          if (this.dragWrapper) {
            this.dragWrapper.remove();
            this.dragWrapper = null;
          }
          if (this.markIndicator) {
            this.markIndicator.remove();
            this.markIndicator = null;
          }
          if (this.dragTip) {
            this.dragTip.remove();
            this.dragTip = null;
          }
        });
      },
    };
  }

  update() {
    if (!this.tableBlot || !this.tableWrapperBlot) return;
    const { rect: tableRect } = getTableMainRect(this.tableBlot);
    if (!tableRect) return;

    this.root.innerHTML = '';

    const tableCols = this.tableBlot.getCols();
    const tableRows = this.tableBlot.getRows();
    const tableWrapperRect = this.tableWrapperBlot.domNode.getBoundingClientRect();
    const rootRect = this.quill.root.getBoundingClientRect();
    Object.assign(this.root.style, {
      top: `${Math.max(tableRect.y, tableWrapperRect.y) - rootRect.y}px`,
      left: `${Math.max(tableRect.x, tableWrapperRect.x) - rootRect.x}px`,
    });

    if (tableCols.length > 0 && tableRows.length > 0) {
      this.corner = document.createElement('div');
      this.corner.classList.add(this.bem.be('corner'));
      Object.assign(this.corner.style, {
        width: `${this.options.size}px`,
        height: `${this.options.size}px`,
      });
      this.corner.addEventListener('click', () => {
        const tableSelection = this.tableModule.getModule<TableSelection>(tableUpInternal.tableSelectionName);
        if (tableSelection && this.tableBlot) {
          tableSelection.setSelectedTds(this.tableBlot.descendants(TableCellInnerFormat));
          tableSelection.show();
          tableSelection.updateWithSelectedTds();
        }
      });
      this.root.appendChild(this.corner);
    }

    if (tableCols.length > 0) {
      let colHeadStr = '';
      for (const col of tableCols) {
        let width = col.domNode.getBoundingClientRect().width;
        if (width === 0) {
          width = Number.parseInt(col.domNode.getAttribute('width')!, 10);
        }
        colHeadStr += `<div class="${this.bem.be('col-header')}" style="width: ${width}px">
          <div class="${this.bem.be('col-separator')}" style="height: ${tableRect.height + this.options.size - 3}px"></div>
        </div>`;
      }
      const colHeadWrapper = document.createElement('div');
      colHeadWrapper.classList.add(this.bem.be('col'));
      const colHead = document.createElement('div');
      colHead.classList.add(this.bem.be('col-wrapper'));
      Object.assign(colHeadWrapper.style, {
        transform: `translateY(-${this.options.size}px)`,
        maxWidth: `${tableWrapperRect.width}px`,
        height: `${this.options.size}px`,
      });
      Object.assign(colHead.style, {
        width: `${tableRect.width}px`,
      });
      colHead.innerHTML = colHeadStr;
      colHeadWrapper.appendChild(colHead);
      this.root.appendChild(colHeadWrapper);
      colHeadWrapper.scrollLeft = this.tableWrapperBlot.domNode.scrollLeft;
      this.colHeadWrapper = colHeadWrapper;
      this.bindColEvents();
    }

    if (tableRows.length > 0) {
      let rowHeadStr = '';
      for (let i = 0; i < tableRows.length; i++) {
        const index = i;
        const row = tableRows[i];
        let height = row.domNode.getBoundingClientRect().height;
        // empty row have different height in chrome and firefox
        // count total height to set
        if (row.children.length === 1 && (row.children.head?.emptyRow.length || 0) > 0) {
          const length = row.children.head!.emptyRow.length;
          for (let start = i + 1; start < tableRows.length && start <= i + length; start++) {
            const nextRow = tableRows[start];
            height += nextRow.domNode.getBoundingClientRect().height;
          }
          i += length;
        }
        rowHeadStr += `<div class="${this.bem.be('row-header')}" data-index="${index}" style="height: ${height}px">
          <div class="${this.bem.be('row-separator')}" style="width: ${tableRect.width + this.options.size - 3}px"></div>
        </div>`;
      }
      const rowHeadWrapper = document.createElement('div');
      rowHeadWrapper.classList.add(this.bem.be('row'));
      const rowHead = document.createElement('div');
      rowHead.classList.add(this.bem.be('row-wrapper'));
      Object.assign(rowHeadWrapper.style, {
        transform: `translateX(-${this.options.size}px)`,
        width: `${this.options.size}px`,
        maxHeight: `${tableWrapperRect.height}px`,
      });
      Object.assign(rowHead.style, {
        height: `${tableRect.height}px`,
      });
      rowHead.innerHTML = rowHeadStr;
      rowHeadWrapper.appendChild(rowHead);
      this.root.appendChild(rowHeadWrapper);
      rowHeadWrapper.scrollTop = this.tableWrapperBlot.domNode.scrollTop;
      this.rowHeadWrapper = rowHeadWrapper;
      this.bindRowEvents();
    }

    // computed about `caption`
    const [tableCaptionBlot] = findChildBlot(this.tableBlot, TableCaptionFormat);
    const tableCaptionIsTop = !tableCaptionBlot || !(tableCaptionBlot?.side === 'top');
    if (tableCaptionIsTop) {
      this.root.classList.remove(this.bem.is('caption-bottom'));
    }
    else {
      this.root.classList.add(this.bem.is('caption-bottom'));
    }
    let cornerTranslateX = -1 * this.options.size;
    let rowHeadWrapperTranslateX = -1 * this.options.size;
    if (isTableAlignRight(this.tableBlot)) {
      this.root.classList.add(this.bem.is('align-right'));
      cornerTranslateX = Math.min(tableWrapperRect.width, tableRect.width);
      rowHeadWrapperTranslateX = Math.min(tableWrapperRect.width, tableRect.width);
    }
    else {
      this.root.classList.remove(this.bem.is('align-right'));
    }
    if (this.corner) {
      Object.assign(this.corner.style, {
        transform: `translateY(${-1 * this.options.size}px) translateX(${cornerTranslateX}px)`,
        top: `${tableCaptionIsTop ? 0 : tableRect.height + this.options.size}px`,
      });
    }
    if (this.rowHeadWrapper) {
      Object.assign(this.rowHeadWrapper.style, {
        transform: `translateX(${rowHeadWrapperTranslateX}px)`,
        maxHeight: `${tableWrapperRect.height}px`,
      });
    }
    if (this.colHeadWrapper) {
      Object.assign(this.colHeadWrapper.style, {
        top: `${tableCaptionIsTop ? 0 : tableRect.height + this.options.size}px`,
        maxWidth: `${tableWrapperRect.width}px`,
      });
    }
  }

  show() {
    if (!this.table || !this.tableBlot) return;

    this.root.classList.remove(this.bem.is('hidden'));
    this.resizeObserver = createResizeObserver(() => this.update(), { ignoreFirstBind: true });
    this.resizeObserver.observe(this.table);

    this.update();
    addScrollEvent.call(this, this.quill.root, () => {
      this.update();
    });
  }

  hide() {
    this.root.classList.add(this.bem.is('hidden'));
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
    }
  }

  destroy() {
    super.destroy();
    this.hide();
    clearScrollEvent.call(this);
    this.quill.off(Quill.events.EDITOR_CHANGE, this.updateWhenTextChange);
    for (const [dom, handle] of this.scrollHandler) {
      dom.removeEventListener('scroll', handle);
    }
    this.root.remove();
  }
}

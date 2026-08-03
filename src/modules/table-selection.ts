import type { EmitterSource, Parchment as TypeParchment, Range as TypeRange } from 'quill';
import type { TableMainFormat, TableWrapperFormat } from '../formats';
import type { TableUp } from '../table-up';
import type { Position, RelactiveRect, TableSelectionOptions } from '../utils';
import Quill from 'quill';
import { getTableMainRect, TableCellFormat, TableCellInnerFormat, TableRowFormat } from '../formats';
import { addScrollEvent, AutoScroller, blotName, clearScrollEvent, createBEM, createResizeObserver, findAllParentBlot, findParentBlot, getElementScrollPosition, getRelativeRect, isRectanglesIntersect, tableUpEvent, tableUpInternal } from '../utils';
import { pasteCells } from './table-clipboard';
import { TableDomSelector } from './table-dom-selector';
import { copyCell } from './table-menu/constants';

const ERROR_LIMIT = 0;

export interface SelectionData {
  anchorNode: Node | null;
  anchorOffset: number;
  focusNode: Node | null;
  focusOffset: number;
}

export class TableSelection extends TableDomSelector {
  static moduleName: string = tableUpInternal.tableSelectionName;

  options: TableSelectionOptions;
  boundary: RelactiveRect | null = null;
  scrollRecordEls: HTMLElement[] = [];
  startScrollRecordPosition: Position[] = [];
  selectedTds: TableCellInnerFormat[] = [];
  // whether the current drag's mousedown anchor started on a frozen row —
  // determines whether vertical scroll-diff correction applies to it
  dragAnchorFrozen: boolean = false;
  dragAnchorFrozenCol: boolean = false;
  cellSelectWrap: HTMLElement;
  cellSelect: HTMLElement;
  scrollHandler: [HTMLElement, (...args: any[]) => void][] = [];
  resizeObserver: ResizeObserver;
  isDisplaySelection = false;
  bem = createBEM('selection');
  autoScroller: AutoScroller;
  lastSelection: SelectionData = {
    anchorNode: null,
    anchorOffset: 0,
    focusNode: null,
    focusOffset: 0,
  };

  _dragging: boolean = false;
  set dragging(val: boolean) {
    if (this._dragging === val) return;
    this._dragging = val;
    this.quill.emitter.emit(val ? tableUpEvent.TABLE_SELECTION_DRAG_START : tableUpEvent.TABLE_SELECTION_DRAG_END, this);
  }

  get dragging() {
    return this._dragging;
  }

  constructor(public tableModule: TableUp, public quill: Quill, options: Partial<TableSelectionOptions> = {}) {
    super(tableModule, quill);
    this.options = this.resolveOptions(options);
    this.scrollRecordEls = [this.quill.root, document.documentElement];

    this.cellSelectWrap = tableModule.addContainer(this.bem.b());
    this.cellSelect = this.helpLinesInitial();

    this.resizeObserver = createResizeObserver(this.updateAfterEvent, { ignoreFirstBind: true });
    this.resizeObserver.observe(this.quill.root);

    document.addEventListener('paste', this.handlePaste);
    document.addEventListener('selectionchange', this.selectionChangeHandler);
    this.quill.on(tableUpEvent.AFTER_TABLE_RESIZE, this.updateAfterEvent);
    this.quill.on(Quill.events.SELECTION_CHANGE, this.quillSelectionChangeHandler);
    this.quill.on(Quill.events.EDITOR_CHANGE, this.updateWhenTextChange);

    this.autoScroller = new AutoScroller(50, 40);
    this.hide();
  }

  handlePaste = (event: ClipboardEvent) => {
    const activeElement = document.activeElement && this.quill.root.contains(document.activeElement);
    if (!activeElement || this.quill.getSelection()) return;

    const clipboardData = event.clipboardData;
    if (!clipboardData) return;
    event.preventDefault();

    const currentSelectedTds = this.selectedTds;
    if (currentSelectedTds.length <= 0) return;

    const html = clipboardData.getData('text/html');
    const delta = this.quill.clipboard.convert({ html }).ops.filter(op => op.attributes?.[blotName.tableCellInner]);

    if (delta.length === 0) return;

    pasteCells(
      { quill: this.quill, talbeModule: this.tableModule },
      currentSelectedTds,
      delta,
    );
  };

  keyboardHandler = async (e: KeyboardEvent) => {
    if (e.ctrlKey) {
      switch (e.key) {
        case 'c':
        case 'x': {
          await copyCell(this.tableModule, this.selectedTds, e.key === 'x');
          break;
        }
      }
    }
    else if (e.key === 'Backspace' || e.key === 'Delete') {
      this.removeCellBySelectedTds();
    }
  };

  updateWhenTextChange = (eventName: string) => {
    if (eventName === Quill.events.TEXT_CHANGE) {
      if (this.table && !this.quill.root.contains(this.table)) {
        this.setSelectionTable(undefined);
      }
      else {
        this.updateAfterEvent();
      }
    }
  };

  updateAfterEvent = () => {
    // if any cell doesn't exist, selection will be cleared
    for (const td of this.selectedTds) {
      if (!td.domNode.isConnected) {
        this.selectedTds = [];
        break;
      }
    }
    this.updateWithSelectedTds();
  };

  removeCellBySelectedTds() {
    const range = this.quill.getSelection();
    const activeElement = document.activeElement;
    if (range || !this.quill.root.contains(activeElement)) return;

    if (this.table) {
      const tableMain = Quill.find(this.table) as TableMainFormat;
      const cells = tableMain.descendants(TableCellInnerFormat);
      if (this.selectedTds.length === cells.length) {
        tableMain.remove();
        return;
      }
    }
    for (const td of this.selectedTds) {
      const clearTd = td.clone() as TypeParchment.Parent;
      clearTd.appendChild(td.scroll.create('block'));
      td.parent.insertBefore(clearTd, td);
      td.remove();
    }
  }

  setSelectedTds(tds: TableCellInnerFormat[]) {
    const currentSelectedTds = new Set(this.selectedTds);
    const isSame = this.selectedTds.length === tds.length && tds.every(td => currentSelectedTds.has(td));

    this.selectedTds = tds;
    if (!isSame) {
      this.quill.emitter.emit(tableUpEvent.TABLE_SELECTION_CHANGE, this, this.selectedTds);
    }
  }

  quillSelectionChangeHandler = (range: TypeRange | null, _oldRange: TypeRange | null, source: EmitterSource) => {
    if (source === Quill.sources.API) return;
    if (range && !this.quill.composition.isComposing && this.selectedTds.length > 0) {
      const formats = this.quill.getFormat(range);
      const [line] = this.quill.getLine(range.index);
      const isInCell = !!formats[blotName.tableCellInner] && !!line;
      // if the selection is in the cell inner, should not update
      const containsLine = line && this.selectedTds.some(td => td.domNode.contains(line.domNode));

      if (isInCell && !containsLine) {
        try {
          const cellInner = findParentBlot(line!, blotName.tableCellInner) as TableCellInnerFormat;
          this.setSelectedTds([cellInner]);
          this.updateWithSelectedTds();
        }
        catch {
          // do nothing. should not into here
        }
      }
      else if (!(isInCell && containsLine)) {
        this.hide();
      }
    }
  };

  setSelectionData(selection: Selection, selectionData: SelectionData) {
    const { anchorNode, anchorOffset, focusNode, focusOffset } = selectionData;
    if (!anchorNode || !focusNode) return;
    const range = document.createRange();
    const isUpFromDown = this.selectionDirectionUp(selectionData);
    if (isUpFromDown) {
      range.setStart(anchorNode, anchorOffset);
      range.setEnd(anchorNode, anchorOffset);
    }
    else {
      range.setStart(anchorNode, anchorOffset);
      range.setEnd(focusNode, focusOffset);
    }
    selection.removeAllRanges();
    selection.addRange(range);
    if (isUpFromDown) {
      selection.extend(focusNode, focusOffset);
    }
  }

  selectionDirectionUp(selection: SelectionData) {
    const { anchorNode, anchorOffset, focusNode, focusOffset } = selection;
    if (!anchorNode || !focusNode) return false;

    if (anchorNode === focusNode) {
      return anchorOffset > focusOffset;
    }

    const nodePosition = anchorNode.compareDocumentPosition(focusNode);
    // focus contains anchor
    if (nodePosition & Node.DOCUMENT_POSITION_CONTAINS) {
      // is anchor before focus
      return (nodePosition & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    }

    // anchor contains focus
    if (nodePosition & Node.DOCUMENT_POSITION_CONTAINED_BY) {
      // is focus before anchor
      return (nodePosition & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    }

    // compare position
    return (nodePosition & Node.DOCUMENT_POSITION_PRECEDING) !== 0;
  }

  resolveOptions(options: Partial<TableSelectionOptions>): TableSelectionOptions {
    return Object.assign({
      selectColor: '#0589f340',
    } as TableSelectionOptions, options);
  }

  getSelectedTdsFormat() {
    if (this.selectedTds.length <= 0) return {};
    const allFormats: Record<string, any>[] = [];
    for (const innerTd of this.selectedTds) {
      const index = innerTd.offset(this.quill.scroll);
      const length = innerTd.length();
      allFormats.push(this.quill.getFormat(index, length));
    }
    // intersect: only keep formats that exist in ALL tds with the same value
    const result: Record<string, any> = {};
    const first = allFormats[0];
    for (const [key, value] of Object.entries(first)) {
      if (allFormats.every(f => f[key] === value)) {
        result[key] = value;
      }
    }
    return result;
  }

  selectionChangeHandler = () => {
    const selection = window.getSelection();
    if (!selection) return;
    const { anchorNode, focusNode, anchorOffset, focusOffset } = selection;
    if (!anchorNode || !focusNode) return;

    const anchorBlot = Quill.find(anchorNode) as TypeParchment.Blot;
    const focusBlot = Quill.find(focusNode) as TypeParchment.Blot;
    if (!anchorBlot || !focusBlot || anchorBlot.scroll !== this.quill.scroll || focusBlot.scroll !== this.quill.scroll) return;

    const anchorNames = findAllParentBlot(anchorBlot);
    const focusNames = findAllParentBlot(focusBlot);

    // if cursor into colgourp should into table or out table by lastSelection
    const isAnchorInColgroup = anchorNames.has(blotName.tableColgroup);
    const isFocusInColgroup = focusNames.has(blotName.tableColgroup);
    if (isAnchorInColgroup || isFocusInColgroup) {
      let newAnchorNode = anchorNode;
      let newAnchorOffset = anchorOffset;
      let newFocusNode = focusNode;
      let newFocusOffset = focusOffset;
      // default move cursor to first cell
      if (isAnchorInColgroup) {
        const tableWrapperBlot = anchorNames.get(blotName.tableWrapper) as TableWrapperFormat;
        const cellInner = tableWrapperBlot.descendants(TableCellInnerFormat);
        if (cellInner.length > 0) {
          newAnchorNode = cellInner[0].domNode;
          newAnchorOffset = 0;
        }
      }
      if (isFocusInColgroup) {
        const tableWrapperBlot = focusNames.get(blotName.tableWrapper) as TableWrapperFormat;
        const cellInner = tableWrapperBlot.descendants(TableCellInnerFormat);
        if (cellInner.length > 0) {
          newFocusNode = cellInner[0].domNode;
          newFocusOffset = 0;
        }
      }
      this.setSelectionData(selection, {
        anchorNode: newAnchorNode,
        anchorOffset: newAnchorOffset,
        focusNode: newFocusNode,
        focusOffset: newFocusOffset,
      });
      return;
    }

    // if the selection in the table partial
    const isAnchorInCellInner = anchorNames.has(blotName.tableCellInner);
    const isFocusInCellInner = focusNames.has(blotName.tableCellInner);
    let isNotSameCellInner = isAnchorInCellInner && isFocusInCellInner;
    if (isNotSameCellInner) {
      const anchorCellBlot = anchorNames.get(blotName.tableCellInner) as TableCellInnerFormat;
      const focusCellBlot = focusNames.get(blotName.tableCellInner) as TableCellInnerFormat;
      isNotSameCellInner &&= (anchorCellBlot !== focusCellBlot);
    }
    if (
      (isAnchorInCellInner && isFocusInCellInner && isNotSameCellInner)
      || (!isAnchorInCellInner && isFocusInCellInner)
      || (!isFocusInCellInner && isAnchorInCellInner)
    ) {
      this.setSelectionData(selection, this.lastSelection);
      if (this.selectedTds.length > 0) {
        this.hide();
      }
      return;
    }

    this.lastSelection = {
      anchorNode,
      anchorOffset,
      focusNode,
      focusOffset,
    };
  };

  helpLinesInitial() {
    this.cellSelectWrap.style.setProperty('--select-color', this.options.selectColor);
    const cellSelect = document.createElement('div');
    cellSelect.classList.add(this.bem.be('line'));
    this.cellSelectWrap.appendChild(cellSelect);
    return cellSelect;
  }

  computeSelectedTds(startPoint: Position, endPoint: Position) {
    if (!this.table) return [];
    type TempSortedTableCellFormat = TableCellFormat & { index?: number; __rect?: DOMRect };

    const tableMainBlot = Quill.find(this.table) as TableMainFormat;
    if (!tableMainBlot) return [];
    // Use TableCell to calculation selected range, because TableCellInner is scrollable, the width will effect calculate
    const tableCells = new Set(
      // reverse cell. search from bottom.
      // when mouse click on the cell border. the selection will be in the lower cell.
      // but `isRectanglesIntersect` judge intersect include border. the upper cell bottom border will intersect with boundary
      // so need to search the cell from bottom
      (tableMainBlot.descendants(TableCellFormat) as TempSortedTableCellFormat[]).map((cell, i) => {
        cell.index = i;
        return cell;
      }),
    );

    // frozen cells stay sticky regardless of scroll; cells scrolled behind them share the same screen rect but are hidden.
    // exclude fully-hidden cells. cache getBoundingClientRect per call to avoid repeated layout reads on every mousemove.
    const getCellRect = (cell: TempSortedTableCellFormat) => cell.__rect ?? (cell.__rect = cell.domNode.getBoundingClientRect());

    const freezeRow = tableMainBlot.freezeRow;
    if (freezeRow > 0) {
      const rowIdToIndex = new Map(tableMainBlot.getRowIds().map((id, i) => [id, i]));
      const frozenCells = new Set<TempSortedTableCellFormat>();
      let frozenBottom = Number.NEGATIVE_INFINITY;
      for (const cell of tableCells) {
        const rowIndex = rowIdToIndex.get(cell.rowId) ?? -1;
        if (rowIndex !== -1 && rowIndex < freezeRow) {
          frozenCells.add(cell);
          const rect = getCellRect(cell);
          if (rect.bottom > frozenBottom) frozenBottom = rect.bottom;
        }
      }
      if (frozenCells.size > 0) {
        for (const cell of tableCells) {
          if (frozenCells.has(cell)) continue;
          const rect = getCellRect(cell);
          if (rect.bottom <= frozenBottom) {
            tableCells.delete(cell);
          }
          else if (rect.top < frozenBottom) {
            cell.__rect = new DOMRect(rect.x, frozenBottom, rect.width, rect.bottom - frozenBottom);
          }
        }
      }
    }
    const freezeCol = tableMainBlot.freezeCol;
    if (freezeCol > 0) {
      const colIdToIndex = new Map(tableMainBlot.getColIds().map((id, i) => [id, i]));
      const frozenColCells = new Set<TempSortedTableCellFormat>();
      let frozenRight = Number.NEGATIVE_INFINITY;
      for (const cell of tableCells) {
        const colIndex = colIdToIndex.get(cell.colId) ?? -1;
        if (colIndex !== -1 && colIndex < freezeCol) {
          frozenColCells.add(cell);
          const rect = getCellRect(cell);
          if (rect.right > frozenRight) frozenRight = rect.right;
        }
      }
      if (frozenColCells.size > 0) {
        for (const cell of tableCells) {
          if (frozenColCells.has(cell)) continue;
          const rect = getCellRect(cell);
          if (rect.right <= frozenRight) {
            tableCells.delete(cell);
          }
          else if (rect.left < frozenRight) {
            cell.__rect = new DOMRect(frozenRight, rect.y, rect.right - frozenRight, rect.height);
          }
        }
      }
    }

    const scrollDiff = this.getScrollPositionDiff();
    // set boundary to initially mouse move rectangle
    const { rect: tableRect } = getTableMainRect(tableMainBlot);
    if (!tableRect) return [];
    // frozen anchor points are sticky and don't drift with scroll, so skip the scroll-diff correction on that axis.
    const startPointX = startPoint.x + (this.dragAnchorFrozenCol ? 0 : scrollDiff.x);
    const startPointY = startPoint.y + (this.dragAnchorFrozen ? 0 : scrollDiff.y);
    let boundary = {
      x: Math.max(tableRect.left, Math.min(endPoint.x, startPointX)),
      y: Math.max(tableRect.top, Math.min(endPoint.y, startPointY)),
      x1: Math.min(tableRect.right, Math.max(endPoint.x, startPointX)),
      y1: Math.min(tableRect.bottom, Math.max(endPoint.y, startPointY)),
    };

    const selectedCells = new Set<TempSortedTableCellFormat>();
    let findEnd = true;
    while (findEnd) {
      findEnd = false;
      for (const cell of tableCells) {
        const { x, y, right, bottom } = getCellRect(cell);
        // floor both sides to pixel precision to avoid sub-pixel floating point errors in intersection check
        if (
          isRectanglesIntersect(
            { x: Math.floor(boundary.x), y: Math.floor(boundary.y), x1: Math.floor(boundary.x1), y1: Math.floor(boundary.y1) },
            { x: Math.floor(x), y: Math.floor(y), x1: Math.floor(right), y1: Math.floor(bottom) },
            ERROR_LIMIT,
            false,
          )
        ) {
          selectedCells.add(cell);
          tableCells.delete(cell);
          // only re-scan if the boundary actually expanded; merged cells can grow it in any direction
          if (x < boundary.x || y < boundary.y || right > boundary.x1 || bottom > boundary.y1) {
            findEnd = true;
          }
          boundary = {
            x: Math.min(boundary.x, x),
            y: Math.min(boundary.y, y),
            x1: Math.max(boundary.x1, right),
            y1: Math.max(boundary.y1, bottom),
          };
        }
      }
    }
    for (const cell of [...selectedCells, ...tableCells]) {
      delete cell.__rect;
    }
    // save result boundary relative to the editor
    this.boundary = getRelativeRect({
      ...boundary,
      width: boundary.x1 - boundary.x,
      height: boundary.y1 - boundary.y,
    }, this.quill.root);
    return Array.from(selectedCells).toSorted((a, b) => a.index! - b.index!).map((cell) => {
      delete cell.index;
      return cell.getCellInner();
    });
  }

  getScrollPositionDiff() {
    return this.startScrollRecordPosition.reduce((pre, { x, y }, i) => {
      const { x: currentX, y: currentY } = getElementScrollPosition(this.scrollRecordEls[i]);
      pre.x += x - currentX;
      pre.y += y - currentY;
      return pre;
    }, { x: 0, y: 0 });
  }

  recordScrollPosition() {
    this.clearRecordScrollPosition();
    for (const el of this.scrollRecordEls) {
      this.startScrollRecordPosition.push(getElementScrollPosition(el));
    }
  }

  clearRecordScrollPosition() {
    this.startScrollRecordPosition = [];
  }

  tableSelectHandler(mousedownEvent: MouseEvent) {
    const { button, target, clientX, clientY } = mousedownEvent;
    const closestTable = (target as HTMLElement).closest<HTMLTableElement>('table');
    const closestTableCaption = (target as HTMLElement).closest('caption');
    if (button !== 0 || !closestTable || closestTableCaption) return;

    this.setSelectionTable(closestTable);
    const startTableId = closestTable.dataset.tableId;
    const startPoint = { x: clientX, y: clientY };
    this.dragAnchorFrozen = Boolean(
      document.elementFromPoint(clientX, clientY)?.closest('tr')?.classList.contains('is-frozen'),
    );
    this.dragAnchorFrozenCol = Boolean(
      document.elementFromPoint(clientX, clientY)?.closest('td, th')?.classList.contains('is-frozen-col'),
    );

    this.recordScrollPosition();
    this.setSelectedTds(this.computeSelectedTds(startPoint, startPoint));
    this.show();

    const mouseMoveHandler = (mousemoveEvent: MouseEvent) => {
      this.dragging = true;
      const { button, target, clientX, clientY } = mousemoveEvent;
      const closestTable = (target as HTMLElement).closest<HTMLTableElement>('.ql-table');
      const closestTableCaption = (target as HTMLElement).closest('caption');
      if (
        button !== 0
        || closestTableCaption
        || !closestTable || closestTable.dataset.tableId !== startTableId
      ) {
        return;
      }

      const movePoint = { x: clientX, y: clientY };
      this.setSelectedTds(this.computeSelectedTds(startPoint, movePoint));
      if (this.selectedTds.length > 1) {
        this.quill.blur();
      }
      this.update();
      this.autoScroller.updateMousePosition(clientX, clientY);
    };
    const mouseUpHandler = () => {
      document.body.removeEventListener('mousemove', mouseMoveHandler, false);
      document.body.removeEventListener('mouseup', mouseUpHandler, false);
      this.autoScroller.stop();
      this.dragging = false;
      this.dragAnchorFrozen = false;
      this.dragAnchorFrozenCol = false;
      this.clearRecordScrollPosition();
    };

    document.body.addEventListener('mousemove', mouseMoveHandler, false);
    document.body.addEventListener('mouseup', mouseUpHandler, false);
    const tableMain = Quill.find(closestTable) as TableMainFormat;
    if (!tableMain) return;
    const tableWrapper = tableMain.parent!.domNode as HTMLElement;
    this.autoScroller.updateMousePosition(clientX, clientY);
    // re-run hit testing on every auto-scroll tick (not just on `mousemove`),
    // using the last known mouse position, so the selection keeps growing
    // while the user holds the mouse near an edge without moving it further.
    this.autoScroller.start(tableWrapper, () => {
      this.setSelectedTds(this.computeSelectedTds(startPoint, { x: this.autoScroller.mouseX, y: this.autoScroller.mouseY }));
      this.update();
    });
  }

  updateWithSelectedTds() {
    if (this.selectedTds.length <= 0) {
      this.hide();
      return;
    }
    const startPoint = { x: Infinity, y: Infinity };
    const endPoint = { x: -Infinity, y: -Infinity };
    for (const cell of this.selectedTds) {
      const td = cell.parent;
      const rect = td.domNode.getBoundingClientRect();
      startPoint.x = Math.min(startPoint.x, rect.left);
      startPoint.y = Math.min(startPoint.y, rect.top);
      endPoint.x = Math.max(endPoint.x, rect.right);
      endPoint.y = Math.max(endPoint.y, rect.bottom);
    }
    this.setSelectedTds(this.computeSelectedTds(startPoint, endPoint));
    if (this.selectedTds.length > 0) {
      this.update();
    }
    else {
      this.hide();
    }
  }

  // Recompute the boundary fresh from each selected cell's *current* rect,
  // instead of translating a cached boundary by a scroll delta. Sticky
  // (frozen) cells and normal cells move independently on scroll, so a
  // single "how much did everything shift" delta can't correctly track
  // both at once — reading live rects handles both without special-casing.
  recomputeBoundaryFromSelectedTds() {
    if (this.selectedTds.length <= 0 || !this.table) return;

    // A non-frozen cell scrolled behind the frozen band is geometrically
    // well-defined but visually hidden. Clamp its top/left contribution to
    // the frozen boundary so it can't pull the selection box into the hidden
    // area. Frozen cells are never clamped on their frozen axis. Both axes
    // are independent.
    const tableMainBlot = Quill.find(this.table) as TableMainFormat;
    if (!tableMainBlot) return;
    const freezeRow = tableMainBlot.freezeRow;
    const freezeCol = tableMainBlot.freezeCol;
    const rows = freezeRow > 0 || freezeCol > 0 ? tableMainBlot.descendants(TableRowFormat) : [];

    let frozenBottom = Number.NEGATIVE_INFINITY;
    if (freezeRow > 0 && rows.length >= freezeRow) {
      frozenBottom = rows[freezeRow - 1].domNode.getBoundingClientRect().bottom;
    }
    // Use the left edge of the first non-frozen column cell as frozenRight.
    // Using a frozen cell's right edge is incorrect when it has colspan
    // spanning into non-frozen columns — the left of colIndex===freezeCol
    // is always the exact frozen boundary regardless of merging.
    let frozenRight = Number.NEGATIVE_INFINITY;
    if (freezeCol > 0) {
      const colIdToIndex = new Map(tableMainBlot.getColIds().map((id, i) => [id, i]));
      for (const row of rows) {
        let cell = row.children.head as TableCellFormat | null;
        let found = false;
        while (cell) {
          if (colIdToIndex.get(cell.colId) === freezeCol) {
            frozenRight = cell.domNode.getBoundingClientRect().left;
            found = true;
            break;
          }
          cell = cell.next as TableCellFormat | null;
        }
        if (found) break;
      }
    }

    const startPoint = { x: Infinity, y: Infinity };
    const endPoint = { x: -Infinity, y: -Infinity };
    for (const cell of this.selectedTds) {
      const td = cell.parent;
      const rect = td.domNode.getBoundingClientRect();
      const top = cell.isFrozenRow ? rect.top : Math.max(rect.top, frozenBottom);
      const left = cell.isFrozenCol ? rect.left : Math.max(rect.left, frozenRight);
      startPoint.x = Math.min(startPoint.x, left);
      startPoint.y = Math.min(startPoint.y, top);
      endPoint.x = Math.max(endPoint.x, rect.right);
      endPoint.y = Math.max(endPoint.y, rect.bottom);
    }
    this.boundary = getRelativeRect({
      x: startPoint.x,
      y: startPoint.y,
      width: endPoint.x - startPoint.x,
      height: endPoint.y - startPoint.y,
    }, this.quill.root);
  }

  update() {
    if (!this.table) {
      this.hide();
      return;
    }
    if (this.selectedTds.length === 0) return;
    this.recomputeBoundaryFromSelectedTds();
    if (!this.boundary) return;
    const { x: editorScrollX, y: editorScrollY } = getElementScrollPosition(this.quill.root);
    const tableWrapperRect = this.table.parentElement!.getBoundingClientRect();
    const rootRect = this.quill.root.getBoundingClientRect();
    const wrapLeft = tableWrapperRect.x - rootRect.x;
    const wrapTop = tableWrapperRect.y - rootRect.y;

    Object.assign(this.cellSelect.style, {
      left: `${this.boundary.x + editorScrollX - wrapLeft}px`,
      top: `${this.boundary.y + editorScrollY - wrapTop}px`,
      width: `${this.boundary.width}px`,
      height: `${this.boundary.height}px`,
    });
    Object.assign(this.cellSelectWrap.style, {
      left: `${wrapLeft}px`,
      top: `${wrapTop}px`,
      width: `${tableWrapperRect.width}px`,
      height: `${tableWrapperRect.height}px`,
    });
    this.quill.emitter.emit(tableUpEvent.TABLE_SELECTION_DISPLAY_CHANGE, this);
  }

  setSelectionTable(table: HTMLTableElement | undefined) {
    if (this.table === table) return;
    this.table = table;
    if (this.table) {
      this.scrollRecordEls.push(this.table.parentElement!);
    }
    else {
      this.scrollRecordEls.pop();
    }
  }

  showDisplay() {
    Object.assign(this.cellSelectWrap.style, { display: 'block' });
    this.isDisplaySelection = true;
    if (!this.table) return;
    this.resizeObserver.observe(this.table);
  }

  show() {
    if (!this.table) return;
    clearScrollEvent.call(this);

    this.showDisplay();
    this.update();
    this.quill.root.addEventListener('keydown', this.keyboardHandler);
    addScrollEvent.call(this, this.quill.root, () => {
      this.update();
    });
    addScrollEvent.call(this, this.table.parentElement!, () => {
      this.update();
    });
  }

  hideDisplay() {
    Object.assign(this.cellSelectWrap.style, { display: 'none' });
    this.isDisplaySelection = false;
    if (!this.table) return;
    this.resizeObserver.unobserve(this.table);
  }

  hide() {
    clearScrollEvent.call(this);
    this.quill.root.removeEventListener('keydown', this.keyboardHandler);
    this.hideDisplay();
    this.boundary = null;
    this.setSelectedTds([]);
    this.setSelectionTable(undefined);
  }

  destroy() {
    super.destroy();
    this.resizeObserver.disconnect();

    this.hide();
    this.cellSelectWrap.remove();
    clearScrollEvent.call(this);

    document.removeEventListener('paste', this.handlePaste);
    document.removeEventListener('selectionchange', this.selectionChangeHandler);
    this.quill.off(tableUpEvent.AFTER_TABLE_RESIZE, this.updateAfterEvent);
    this.quill.off(Quill.events.EDITOR_CHANGE, this.updateWhenTextChange);
    this.quill.off(Quill.events.SELECTION_CHANGE, this.quillSelectionChangeHandler);
  }
}

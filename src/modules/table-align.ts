import type { TableMainFormat, TableWrapperFormat } from '../formats';
import type { TableUp } from '../table-up';
import { autoUpdate, computePosition, flip, limitShift, offset, shift } from '@floating-ui/dom';
import Quill from 'quill';
import { createBEM, createResizeObserver } from '../utils';
import { TableDomSelector } from './table-dom-selector';

export class TableAlign extends TableDomSelector {
  static moduleName: string = 'table-align';

  tableBlot?: TableMainFormat;
  tableWrapperBlot?: TableWrapperFormat;
  alignBox: HTMLElement | null;
  cleanup?: () => void;
  bem = createBEM('align');
  resizeObserver?: ResizeObserver;

  constructor(public tableModule: TableUp, public quill: Quill, _options: any) {
    super(tableModule, quill);

    this.alignBox = this.buildTools();
    this.hide();
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

  buildTools() {
    const alignBox = this.tableModule.addContainer(this.bem.b());
    const icons = Quill.import('ui/icons') as Record<string, any>;
    const alignIcons = {
      left: icons.align[''],
      center: icons.align.center,
      right: icons.align.right,
    };
    for (const [align, iconStr] of Object.entries(alignIcons)) {
      const item = document.createElement('span');
      item.dataset.align = align;
      item.classList.add(this.bem.be('item'));
      item.innerHTML = `<i class="icon">${iconStr}</i>`;
      item.addEventListener('click', this.handleAlignItemClick.bind(this));
      alignBox.appendChild(item);
    }
    return alignBox;
  }

  handleAlignItemClick(e: MouseEvent) {
    const item = e.currentTarget;
    if (!item) return;
    const value = (item as HTMLElement).dataset.align;
    if (value && this.tableBlot) {
      this.setTableAlign(this.tableBlot, value);
    }
  }

  setTableAlign(tableBlot: TableMainFormat, align: string) {
    const cols = tableBlot.getCols();
    for (const col of cols) {
      col.align = align;
    }
  }

  show() {
    if (!this.table || !this.alignBox) return;
    this.tableBlot = Quill.find(this.table) as TableMainFormat;
    this.tableWrapperBlot = this.tableBlot.parent as TableWrapperFormat;
    this.alignBox.classList.remove(this.bem.is('hidden'));
    this.resizeObserver = createResizeObserver(() => this.update(), { ignoreFirstBind: true });
    this.resizeObserver.observe(this.table);
    if (this.cleanup) {
      this.cleanup();
    }
    this.cleanup = autoUpdate(
      this.tableWrapperBlot.domNode,
      this.alignBox,
      () => this.update(),
    );
  }

  hide() {
    this.tableBlot = undefined;
    this.tableWrapperBlot = undefined;
    if (this.alignBox) {
      this.alignBox.classList.add(this.bem.is('hidden'));
    }
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = undefined;
    }
  }

  update() {
    if (!this.alignBox || !this.tableBlot || !this.tableWrapperBlot) return;
    if (!this.table || this.tableBlot.full || this.tableBlot.domNode.offsetWidth >= this.quill.root.offsetWidth) {
      this.hide();
      return;
    }

    computePosition(this.tableWrapperBlot.domNode, this.alignBox, {
      placement: 'top',
      middleware: [flip(), shift({ limiter: limitShift() }), offset(16)],
    }).then(({ x, y }) => {
      Object.assign(this.alignBox!.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    });
  }

  destroy() {
    super.destroy();
    this.hide();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
    }
    this.quill.off(Quill.events.TEXT_CHANGE, this.updateWhenTextChange);
    if (this.alignBox) {
      this.alignBox.remove();
      this.alignBox = null;
    }
  }
}
